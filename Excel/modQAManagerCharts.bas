Attribute VB_Name = "modQAManagerCharts"
'==================================================================================
' Module : modQAManagerCharts
' Purpose: Build a NEW workbook containing one worksheet per unique manager.
'          Each manager tab carries 5 charts derived from the AllData table:
'            Chart 1 - Avg QA score per agent, by month (ranked hi->lo)  [H-bar]
'            Chart 2 - Evaluation counts per agent, by month (A->Z)      [Stacked col]
'            Chart 3 - Top 10 team errors, by month (ranked hi->lo)      [Stacked H-bar]
'            Chart 4 - Top errors split by agent (greatest contributors) [Stacked H-bar]
'            Chart 5 - Top 10 errors all-time (ranked hi->lo)            [H-bar]
'
' Design notes:
'   * All aggregation is done in-memory (Scripting.Dictionary) - no formulas,
'     no scratch/staging worksheets. Each tab stores its own chart-source data
'     in hidden columns so the charts remain stable.
'   * Re-runnable: produces a brand-new workbook each run and never writes to,
'     deletes from, or otherwise modifies the source workbook (read-only).
'   * Robust error trapping: per-manager failures are logged and skipped so one
'     bad tab cannot abort the whole run. A "Run Log" tab captures diagnostics.
'
' Source : All2026QAData.xlsm, sheet "AllData", table "AllData"
'
' Version history:
'   1.0  Initial build.
'   1.1  Locate the data workbook by searching open workbooks for the AllData
'        table/sheet instead of relying on ThisWorkbook (fixes "Subscript out of
'        range" when the module runs from Personal.xlsb or another workbook).
'        Added step tracking + recent-log dump to the failure dialog. The source
'        workbook is only ever READ, never modified.
'   1.2  Tolerant sheet/table matching (trims trailing & non-breaking spaces, the
'        usual cause of "Subscript out of range" on a tab that looks correct).
'        Failure dialogs now list every open workbook/sheet/table in [brackets]
'        so invisible characters are visible. Added QA_Diagnose: a safe, read-only
'        macro that reports the detected workbook, row/column counts, resolved
'        columns and full inventory WITHOUT building anything - run it first.
'   1.3  Fixed blank charts ("flash of bars then nothing"): chart source data
'        lives in hidden columns, and Excel defaults to plotting visible cells
'        only, so every chart dropped its data. Each chart now sets
'        PlotVisibleOnly = False so it draws from the hidden source.
'   1.4  Charts now scale with data volume: bar-chart height grows with category
'        count, the stacked-column chart widens with agent count, and bar charts
'        are generally larger. Added value data labels - outside-end on the two
'        clustered bar charts (1 & 5), center on the stacked charts (2 & 3);
'        Chart 4 is left unlabeled (too many stacked agent segments).
'==================================================================================
Option Explicit

' ---- Configuration ----
Private Const VERSION As String = "1.4"
Private Const DATA_SHEET As String = "AllData"
Private Const TABLE_NAME As String = "AllData"
Private Const KEYSEP As String = "~|~"               ' compound dictionary key separator
Private Const DATA_C0 As Long = 60                   ' first (hidden) column for chart data
Private Const TOP_N As Long = 10                     ' top N errors

' chart geometry (points) - sizes scale with how many categories each chart plots
Private Const LEFT_W As Single = 640      ' width of the horizontal-bar charts (1,3,4,5)
Private Const PER_CAT As Single = 22      ' added height per category (bar charts)
Private Const BAR_BASE As Single = 120    ' fixed overhead: title + axis + legend
Private Const BAR_MINH As Single = 300
Private Const BAR_MAXH As Single = 1000
Private Const COL_H As Single = 360       ' height of the stacked-column chart (2)
Private Const COL_PER As Single = 40      ' added width per agent (column chart)
Private Const COL_BASE As Single = 140
Private Const COL_MINW As Single = 520
Private Const COL_MAXW As Single = 1700

' ---- Module-level diagnostics ----
Private gLog As Object        ' idx -> message (ordered)
Private gLogN As Long
Private gT0 As Double
Private gStep As String       ' current high-level step (for failure diagnostics)

'==================================================================================
' ENTRY POINT
'==================================================================================
Public Sub BuildManagerQAWorkbook()
    Dim prevSU As Boolean, prevEv As Boolean, prevCalc As Long, prevAlerts As Boolean
    Dim wbOut As Workbook
    Dim okCount As Long, warnCount As Long, chartCount As Long
    Dim defaults As Collection

    On Error GoTo Fatal

    Set gLog = CreateObject("Scripting.Dictionary")
    gLogN = 0
    gT0 = Timer
    LogMsg "=== QA Manager Workbook build started (v" & VERSION & ") ==="

    prevSU = Application.ScreenUpdating
    prevEv = Application.EnableEvents
    prevCalc = Application.Calculation
    prevAlerts = Application.DisplayAlerts
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    Application.DisplayAlerts = False
    On Error Resume Next
    Application.Calculation = xlCalculationManual
    On Error GoTo Fatal

    ' ---- 1. Locate the data workbook (does NOT rely on ThisWorkbook) ----
    gStep = "locate data workbook"
    Dim wbSrc As Workbook
    Set wbSrc = ResolveDataWorkbook()
    LogMsg "Data workbook: " & wbSrc.name & "  (read-only; never modified)"

    ' ---- 2. Load data ----
    gStep = "load table data"
    Dim vData As Variant, headers As Variant
    Dim nRows As Long, nCols As Long
    LoadTableData wbSrc, vData, headers, nRows, nCols
    LogMsg "Loaded " & nRows & " data rows, " & nCols & " columns."

    ' ---- 3. Resolve key columns by header ----
    gStep = "resolve columns"
    Dim cAgent As Long, cMgr As Long, cScore As Long, cMonth As Long
    cAgent = ColByHeader(headers, "Agent")
    cMgr = ColByHeader(headers, "Manager")
    cScore = ColByHeader(headers, "Score")
    cMonth = ColByHeader(headers, "Month")
    If cAgent = 0 Or cMgr = 0 Or cScore = 0 Or cMonth = 0 Then
        Err.Raise vbObjectError + 1, , "Required column(s) not found -> " & _
            "Agent=" & cAgent & " Manager=" & cMgr & " Score=" & cScore & " Month=" & cMonth
    End If
    LogMsg "Columns -> Agent:" & cAgent & " Manager:" & cMgr & " Score:" & cScore & " Month:" & cMonth

    Dim reasonCols As Collection
    Set reasonCols = ReasonColumns(headers)
    LogMsg "Detected " & reasonCols.Count & " reason/error columns."
    If reasonCols.Count = 0 Then Err.Raise vbObjectError + 2, , "No 'Reason' columns detected."

    ' ---- 3. Manager merge overrides ----
    Dim overrides As Object
    Set overrides = CreateObject("Scripting.Dictionary")
    overrides.CompareMode = 1
    overrides.Add "Irurzun, Ernie", "Ernie Irurzun"

    ' ---- 4. Single-pass aggregation ----
    gStep = "aggregate rows"
    Dim mgrAgents As Object: Set mgrAgents = CreateObject("Scripting.Dictionary"): mgrAgents.CompareMode = 1
    Dim monthsSeen As Object: Set monthsSeen = CreateObject("Scripting.Dictionary"): monthsSeen.CompareMode = 1
    Dim scoreSum As Object: Set scoreSum = CreateObject("Scripting.Dictionary")
    Dim scoreCnt As Object: Set scoreCnt = CreateObject("Scripting.Dictionary")
    Dim evalCnt As Object: Set evalCnt = CreateObject("Scripting.Dictionary")
    Dim errMonth As Object: Set errMonth = CreateObject("Scripting.Dictionary")
    Dim errAgent As Object: Set errAgent = CreateObject("Scripting.Dictionary")
    Dim mgrErrs As Object: Set mgrErrs = CreateObject("Scripting.Dictionary"): mgrErrs.CompareMode = 1

    Dim R As Long, k As Long, idx As Long
    Dim mgr As String, agent As String, mon As String, errTxt As String
    Dim sc As Variant, kAM As String, ed As Object

    For R = 1 To nRows
        mgr = NzTrim(vData(R, cMgr))
        If mgr <> "" Then
            If overrides.Exists(mgr) Then mgr = overrides(mgr)
            agent = NzTrim(vData(R, cAgent))
            If agent = "" Then agent = "(blank)"
            mon = MonthAbbrev(vData(R, cMonth))
            If mon <> "" Then
                monthsSeen(mon) = MonthOrder(mon)

                If Not mgrAgents.Exists(mgr) Then
                    Dim aSetNew As Object
                    Set aSetNew = CreateObject("Scripting.Dictionary")
                    aSetNew.CompareMode = 1
                    mgrAgents.Add mgr, aSetNew
                End If
                mgrAgents(mgr)(agent) = True

                kAM = mgr & KEYSEP & agent & KEYSEP & mon
                evalCnt(kAM) = NzNum(evalCnt(kAM)) + 1
                sc = vData(R, cScore)
                If IsNumeric(sc) Then
                    scoreSum(kAM) = NzNum(scoreSum(kAM)) + CDbl(sc)
                    scoreCnt(kAM) = NzNum(scoreCnt(kAM)) + 1
                End If

                For k = 1 To reasonCols.Count
                    idx = reasonCols(k)
                    errTxt = NzTrim(vData(R, idx))
                    If errTxt <> "" And errTxt <> "0" Then
                        errMonth(mgr & KEYSEP & errTxt & KEYSEP & mon) = NzNum(errMonth(mgr & KEYSEP & errTxt & KEYSEP & mon)) + 1
                        errAgent(mgr & KEYSEP & errTxt & KEYSEP & agent) = NzNum(errAgent(mgr & KEYSEP & errTxt & KEYSEP & agent)) + 1
                        If Not mgrErrs.Exists(mgr) Then
                            Dim edNew As Object
                            Set edNew = CreateObject("Scripting.Dictionary")
                            edNew.CompareMode = 1
                            mgrErrs.Add mgr, edNew
                        End If
                        Set ed = mgrErrs(mgr)
                        ed(errTxt) = NzNum(ed(errTxt)) + 1
                    End If
                Next k
            End If
        End If
    Next R

    Dim months() As String
    months = OrderedMonths(monthsSeen)
    LogMsg "Months (ordered): " & Join1(months)
    LogMsg "Managers found: " & mgrAgents.Count

    ' ---- 5. Create output workbook ----
    gStep = "create output workbook"
    Set wbOut = Application.Workbooks.Add
    Set defaults = New Collection
    Dim wsTmp As Worksheet
    For Each wsTmp In wbOut.Worksheets
        defaults.Add wsTmp.name
    Next wsTmp

    Dim usedNames As Object: Set usedNames = CreateObject("Scripting.Dictionary"): usedNames.CompareMode = 1

    Dim mgrNames() As String
    mgrNames = ToStr0(mgrAgents.keys)
    SortStringsAsc mgrNames

    Dim i As Long, res As Long
    gStep = "build manager tabs"
    For i = 0 To UBound(mgrNames)
        mgr = mgrNames(i)
        gStep = "build tab: " & mgr
        res = BuildManagerTab(wbOut, usedNames, mgr, mgrAgents(mgr), months, _
                              scoreSum, scoreCnt, evalCnt, errMonth, errAgent, mgrErrs, chartCount)
        If res = 0 Then okCount = okCount + 1 Else warnCount = warnCount + 1
    Next i

    ' ---- 6. Run log + cleanup ----
    gStep = "finalize"
    WriteRunLog wbOut, usedNames, okCount, warnCount, chartCount
    RemoveDefaults wbOut, defaults

    RestoreApp prevSU, prevEv, prevCalc, prevAlerts

    LogMsg "=== Done. Tabs OK:" & okCount & " Warn:" & warnCount & " Charts:" & chartCount & _
           " Elapsed:" & Format(Timer - gT0, "0.0") & "s ==="

    MsgBox "QA Manager workbook created." & vbCrLf & vbCrLf & _
           "Manager tabs OK : " & okCount & vbCrLf & _
           "Tabs w/ warnings: " & warnCount & vbCrLf & _
           "Charts created  : " & chartCount & vbCrLf & _
           "Elapsed         : " & Format(Timer - gT0, "0.0") & " s" & vbCrLf & vbCrLf & _
           "See the 'Run Log' tab for details. Save the new workbook to keep it.", _
           vbInformation, "QA Build v" & VERSION
    Exit Sub

Fatal:
    Dim em As String
    em = "FATAL [" & Err.Number & "] " & Err.Description
    LogMsg em
    On Error Resume Next
    If Not wbOut Is Nothing Then WriteRunLog wbOut, usedNames, okCount, warnCount, chartCount
    RestoreApp prevSU, prevEv, prevCalc, prevAlerts
    MsgBox em & vbCrLf & vbCrLf & _
           "Failed at step: " & gStep & vbCrLf & vbCrLf & _
           "Your source workbook was only READ, never modified." & vbCrLf & vbCrLf & _
           RecentLog(14), _
           vbCritical, "QA Build FAILED v" & VERSION
End Sub

'==================================================================================
' DIAGNOSTICS - safe, read-only. Run this FIRST to confirm the environment.
' Builds nothing and modifies nothing; just reports what was detected.
'==================================================================================
Public Sub QA_Diagnose()
    Dim wbSrc As Workbook
    Dim vData As Variant, headers As Variant, nRows As Long, nCols As Long
    Dim cA As Long, cM As Long, cS As Long, cMo As Long
    Dim rc As Collection, msg As String

    On Error GoTo D_Err
    Set wbSrc = ResolveDataWorkbook()
    LoadTableData wbSrc, vData, headers, nRows, nCols
    cA = ColByHeader(headers, "Agent")
    cM = ColByHeader(headers, "Manager")
    cS = ColByHeader(headers, "Score")
    cMo = ColByHeader(headers, "Month")
    Set rc = ReasonColumns(headers)

    msg = "QA DIAGNOSTICS  (module v" & VERSION & ")" & vbCrLf & String(48, "-") & vbCrLf
    msg = msg & "Data workbook : " & wbSrc.name & vbCrLf
    msg = msg & "Data rows     : " & nRows & vbCrLf
    msg = msg & "Columns       : " & nCols & vbCrLf & vbCrLf
    msg = msg & "Column resolution (0 = NOT FOUND):" & vbCrLf
    msg = msg & "   Agent       : " & cA & vbCrLf
    msg = msg & "   Manager     : " & cM & vbCrLf
    msg = msg & "   Score       : " & cS & vbCrLf
    msg = msg & "   Month       : " & cMo & vbCrLf
    msg = msg & "   Reason cols : " & rc.Count & vbCrLf & vbCrLf
    If cA = 0 Or cM = 0 Or cS = 0 Or cMo = 0 Or rc.Count = 0 Then
        msg = msg & ">> One or more required columns were NOT found. Tell me which." & vbCrLf & vbCrLf
    Else
        msg = msg & ">> All required columns resolved. Safe to run BuildManagerQAWorkbook." & vbCrLf & vbCrLf
    End If
    msg = msg & InventoryText()
    MsgBox msg, vbInformation, "QA Diagnose v" & VERSION
    Exit Sub

D_Err:
    MsgBox "QA_Diagnose error [" & Err.Number & "] " & Err.Description & vbCrLf & vbCrLf & InventoryText(), _
           vbCritical, "QA Diagnose v" & VERSION
End Sub

Private Function BuildManagerTab(wbOut As Workbook, usedNames As Object, ByVal mgr As String, _
        aSet As Object, months() As String, _
        scoreSum As Object, scoreCnt As Object, evalCnt As Object, _
        errMonth As Object, errAgent As Object, mgrErrs As Object, _
        ByRef chartCount As Long) As Long

    Dim ws As Worksheet
    Dim stg As String
    On Error GoTo TabErr

    stg = "add sheet"
    Set ws = wbOut.Worksheets.Add(After:=wbOut.Worksheets(wbOut.Worksheets.Count))
    ws.name = UniqueSheetName(usedNames, mgr)

    Dim nm As Long: nm = UBound(months) + 1

    ' ----- agent arrays -----
    stg = "agent arrays"
    Dim agents0() As String: agents0 = ToStr0(aSet.keys)
    Dim nA As Long: nA = UBound(agents0) + 1

    Dim agAvg() As Double: ReDim agAvg(0 To nA - 1)
    Dim ai As Long, mi As Long
    Dim ssum As Double, scnt As Double, kk As String
    For ai = 0 To nA - 1
        ssum = 0: scnt = 0
        For mi = 0 To nm - 1
            kk = mgr & KEYSEP & agents0(ai) & KEYSEP & months(mi)
            ssum = ssum + NzNum(scoreSum(kk))
            scnt = scnt + NzNum(scoreCnt(kk))
        Next mi
        If scnt > 0 Then agAvg(ai) = ssum / scnt Else agAvg(ai) = -1
    Next ai

    ' Chart1 order: ascending avg (so highest ends at TOP of bar chart)
    Dim a1() As String, v1() As Double
    a1 = agents0: v1 = agAvg
    SortPairs a1, v1, True
    ' Chart2 order: agent name A->Z
    Dim a2() As String
    a2 = agents0: SortStringsAsc a2

    ' ----- error arrays (top N by total) -----
    stg = "error arrays"
    Dim T As Long: T = 0
    Dim err0() As String, tot0() As Double
    If mgrErrs.Exists(mgr) Then
        Dim ed As Object: Set ed = mgrErrs(mgr)
        err0 = ToStr0(ed.keys)
        Dim ne As Long: ne = UBound(err0) + 1
        ReDim tot0(0 To ne - 1)
        Dim e As Long
        For e = 0 To ne - 1
            tot0(e) = CDbl(ed(err0(e)))
        Next e
        SortPairs err0, tot0, False     ' descending by total
        T = ne: If T > TOP_N Then T = TOP_N
    End If

    ' ----- contributing agents for Chart 4 (desc by contribution) -----
    Dim sAg() As String, sCon() As Double, cKeep As Long
    cKeep = 0
    If T > 0 Then
        ReDim sAg(0 To nA - 1): ReDim sCon(0 To nA - 1)
        Dim cc As Double, rr As Long
        For ai = 0 To nA - 1
            cc = 0
            For rr = 0 To T - 1
                cc = cc + NzNum(errAgent(mgr & KEYSEP & err0(rr) & KEYSEP & agents0(ai)))
            Next rr
            If cc > 0 Then
                sAg(cKeep) = agents0(ai): sCon(cKeep) = cc: cKeep = cKeep + 1
            End If
        Next ai
        If cKeep > 0 Then
            ReDim Preserve sAg(0 To cKeep - 1)
            ReDim Preserve sCon(0 To cKeep - 1)
            SortPairs sAg, sCon, False
        End If
    End If

    ' ----- write data blocks into hidden columns -----
    stg = "write data blocks"
    Dim curRow As Long: curRow = 1
    Dim rng1 As Range, rng2 As Range, rng3 As Range, rng4 As Range, rng5 As Range
    Dim arr As Variant
    Dim j As Long, rowi As Long, v As Double

    ' Block 1 - avg score (agents asc by avg x months)
    ReDim arr(1 To nA + 1, 1 To nm + 1)
    arr(1, 1) = "Agent"
    For mi = 0 To nm - 1: arr(1, mi + 2) = months(mi): Next mi
    For ai = 0 To nA - 1
        arr(ai + 2, 1) = a1(ai)
        For mi = 0 To nm - 1
            kk = mgr & KEYSEP & a1(ai) & KEYSEP & months(mi)
            If NzNum(scoreCnt(kk)) > 0 Then arr(ai + 2, mi + 2) = NzNum(scoreSum(kk)) / NzNum(scoreCnt(kk))
        Next mi
    Next ai
    Set rng1 = WriteBlock(ws, curRow, DATA_C0, arr)
    curRow = curRow + (nA + 1) + 2

    ' Block 2 - eval counts (agents A->Z x months)
    ReDim arr(1 To nA + 1, 1 To nm + 1)
    arr(1, 1) = "Agent"
    For mi = 0 To nm - 1: arr(1, mi + 2) = months(mi): Next mi
    For ai = 0 To nA - 1
        arr(ai + 2, 1) = a2(ai)
        For mi = 0 To nm - 1
            v = NzNum(evalCnt(mgr & KEYSEP & a2(ai) & KEYSEP & months(mi)))
            If v > 0 Then arr(ai + 2, mi + 2) = v
        Next mi
    Next ai
    Set rng2 = WriteBlock(ws, curRow, DATA_C0, arr)
    curRow = curRow + (nA + 1) + 2

    ' Block 3 - top errors by month (asc by total so highest at top)
    If T > 0 Then
        ReDim arr(1 To T + 1, 1 To nm + 1)
        arr(1, 1) = "Error"
        For mi = 0 To nm - 1: arr(1, mi + 2) = months(mi): Next mi
        rowi = 0
        For e = T - 1 To 0 Step -1
            rowi = rowi + 1
            arr(rowi + 1, 1) = err0(e)
            For mi = 0 To nm - 1
                v = NzNum(errMonth(mgr & KEYSEP & err0(e) & KEYSEP & months(mi)))
                If v > 0 Then arr(rowi + 1, mi + 2) = v
            Next mi
        Next e
        Set rng3 = WriteBlock(ws, curRow, DATA_C0, arr)
        curRow = curRow + (T + 1) + 2
    End If

    ' Block 4 - top errors split by agent
    If T > 0 And cKeep > 0 Then
        ReDim arr(1 To T + 1, 1 To cKeep + 1)
        arr(1, 1) = "Error"
        For j = 0 To cKeep - 1: arr(1, j + 2) = sAg(j): Next j
        rowi = 0
        For e = T - 1 To 0 Step -1
            rowi = rowi + 1
            arr(rowi + 1, 1) = err0(e)
            For j = 0 To cKeep - 1
                v = NzNum(errAgent(mgr & KEYSEP & err0(e) & KEYSEP & sAg(j)))
                If v > 0 Then arr(rowi + 1, j + 2) = v
            Next j
        Next e
        Set rng4 = WriteBlock(ws, curRow, DATA_C0, arr)
        curRow = curRow + (T + 1) + 2
    End If

    ' Block 5 - top errors all-time totals (asc so highest at top)
    If T > 0 Then
        ReDim arr(1 To T + 1, 1 To 2)
        arr(1, 1) = "Error": arr(1, 2) = "Count"
        rowi = 0
        For e = T - 1 To 0 Step -1
            rowi = rowi + 1
            arr(rowi + 1, 1) = err0(e)
            arr(rowi + 1, 2) = tot0(e)
        Next e
        Set rng5 = WriteBlock(ws, curRow, DATA_C0, arr)
    End If

    ' hide data columns
    ws.Range(ws.Cells(1, DATA_C0), ws.Cells(1, DATA_C0 + 160)).EntireColumn.Hidden = True

    ' ----- charts (sizes scale with category counts) -----
    stg = "charts"
    Dim gx As Single, gy As Single, leftX As Single, rightX As Single
    Dim h1 As Single, h2 As Single, h3 As Single, h4 As Single, h5 As Single, w2 As Single
    Dim top1 As Single, top2 As Single, top3 As Single, band1 As Single, band2 As Single
    gx = 14: gy = 16: leftX = 6: rightX = leftX + LEFT_W + gx

    h1 = BarHeight(nA)
    w2 = ColWidth(nA): h2 = COL_H
    h3 = BarHeight(T): h4 = BarHeight(T): h5 = BarHeight(T)

    top1 = 6
    band1 = h1: If h2 > band1 Then band1 = h2
    top2 = top1 + band1 + gy
    band2 = h3: If h4 > band2 Then band2 = h4
    top3 = top2 + band2 + gy

    Dim co As ChartObject
    Set co = MakeChart(ws, rng1, xlBarClustered, xlColumns, leftX, top1, LEFT_W, h1, _
                       "Avg QA Score by Agent & Month  (high -> low) - " & mgr, _
                       True, True, True, xlLabelPositionOutsideEnd, "0%")
    chartCount = chartCount + 1

    Set co = MakeChart(ws, rng2, xlColumnStacked, xlColumns, rightX, top1, w2, h2, _
                       "Evaluations by Month per Agent (A-Z) - " & mgr, _
                       False, True, True, xlLabelPositionCenter, "0")
    chartCount = chartCount + 1

    If T > 0 Then
        Set co = MakeChart(ws, rng3, xlBarStacked, xlColumns, leftX, top2, LEFT_W, h3, _
                           "Top " & T & " Team Errors by Month - " & mgr, _
                           False, True, True, xlLabelPositionCenter, "0")
        ShrinkCatFont co
        chartCount = chartCount + 1
    Else
        AddNote ws, leftX, top2, LEFT_W, h3, "No errors recorded for this team."
    End If

    If T > 0 And cKeep > 0 Then
        Set co = MakeChart(ws, rng4, xlBarStacked, xlColumns, rightX, top2, LEFT_W, h4, _
                           "Top Errors by Agent (greatest contributors) - " & mgr, _
                           False, True, False, 0, "0")
        ShrinkCatFont co
        chartCount = chartCount + 1
    Else
        AddNote ws, rightX, top2, LEFT_W, h4, "No errors recorded for this team."
    End If

    If T > 0 Then
        Set co = MakeChart(ws, rng5, xlBarClustered, xlColumns, leftX, top3, LEFT_W, h5, _
                           "Top " & T & " Errors (All-Time, high -> low) - " & mgr, _
                           False, False, True, xlLabelPositionOutsideEnd, "0")
        ShrinkCatFont co
        chartCount = chartCount + 1
    Else
        AddNote ws, leftX, top3, LEFT_W, h5, "No errors recorded for this team."
    End If

    BuildManagerTab = 0
    Exit Function

TabErr:
    LogMsg "  [WARN] Manager '" & mgr & "' step '" & stg & "': [" & Err.Number & "] " & Err.Description
    BuildManagerTab = 1
End Function

'==================================================================================
' HELPERS
'==================================================================================
Private Function WriteBlock(ws As Worksheet, ByVal r0 As Long, ByVal c0 As Long, arr As Variant) As Range
    Dim R As Long, c As Long, rng As Range
    R = UBound(arr, 1): c = UBound(arr, 2)
    Set rng = ws.Range(ws.Cells(r0, c0), ws.Cells(r0 + R - 1, c0 + c - 1))
    rng.Value = arr
    Set WriteBlock = rng
End Function

Private Function MakeChart(ws As Worksheet, src As Range, ByVal ct As Long, ByVal pb As Long, _
        ByVal L As Single, ByVal T As Single, ByVal W As Single, ByVal h As Single, _
        ByVal ttl As String, ByVal isPct As Boolean, ByVal showLeg As Boolean, _
        ByVal showLabels As Boolean, ByVal lblPos As Long, ByVal lblFmt As String) As ChartObject
    Dim co As ChartObject, s As Series
    Set co = ws.ChartObjects.Add(L, T, W, h)
    With co.Chart
        .ChartType = ct
        .SetSourceData Source:=src, PlotBy:=pb
        .PlotVisibleOnly = False   ' source data sits in hidden columns - must plot it anyway
        .HasTitle = True
        .ChartTitle.Text = ttl
        .ChartTitle.Font.Size = 10
        .HasLegend = showLeg
        If showLeg Then .Legend.Position = xlLegendPositionBottom
        On Error Resume Next
        If isPct Then
            .Axes(xlValue).MinimumScale = 0
            .Axes(xlValue).MaximumScale = 1
            .Axes(xlValue).TickLabels.NumberFormat = "0%"
        End If
        On Error GoTo 0
        If showLabels Then
            On Error Resume Next
            .ApplyDataLabels
            For Each s In .SeriesCollection
                s.HasDataLabels = True
                s.DataLabels.NumberFormat = lblFmt
                s.DataLabels.Position = lblPos
                s.DataLabels.Font.Size = 8
            Next s
            On Error GoTo 0
        End If
    End With
    Set MakeChart = co
End Function

Private Function BarHeight(ByVal n As Long) As Single
    Dim h As Single
    h = BAR_BASE + n * PER_CAT
    If h < BAR_MINH Then h = BAR_MINH
    If h > BAR_MAXH Then h = BAR_MAXH
    BarHeight = h
End Function

Private Function ColWidth(ByVal n As Long) As Single
    Dim W As Single
    W = COL_BASE + n * COL_PER
    If W < COL_MINW Then W = COL_MINW
    If W > COL_MAXW Then W = COL_MAXW
    ColWidth = W
End Function

Private Sub ShrinkCatFont(co As ChartObject)
    On Error Resume Next
    co.Chart.Axes(xlCategory).TickLabels.Font.Size = 7
    On Error GoTo 0
End Sub

Private Sub AddNote(ws As Worksheet, ByVal L As Single, ByVal T As Single, _
                    ByVal W As Single, ByVal h As Single, ByVal txt As String)
    Dim sh As Shape
    Set sh = ws.Shapes.AddTextbox(msoTextOrientationHorizontal, L, T, W, 40)
    sh.TextFrame2.TextRange.Text = txt
End Sub

Private Function ResolveDataWorkbook() As Workbook
    Dim wb As Workbook
    ' 1) any open workbook containing a table named AllData (any sheet)
    For Each wb In Application.Workbooks
        If Not FindTable(wb, TABLE_NAME) Is Nothing Then Set ResolveDataWorkbook = wb: Exit Function
    Next wb
    ' 2) any open workbook containing a sheet named AllData (space-tolerant match)
    For Each wb In Application.Workbooks
        If Not FindSheet(wb, DATA_SHEET) Is Nothing Then Set ResolveDataWorkbook = wb: Exit Function
    Next wb
    Err.Raise vbObjectError + 20, , "Could not find a table named '" & TABLE_NAME & _
        "' or a sheet named '" & DATA_SHEET & "' in any open workbook." & vbCrLf & _
        "Open All2026QAData.xlsm and run again." & vbCrLf & vbCrLf & InventoryText()
End Function

Private Function FindTable(wb As Workbook, ByVal tblName As String) As ListObject
    Dim ws As Worksheet, lo As ListObject
    On Error Resume Next
    For Each ws In wb.Worksheets
        For Each lo In ws.ListObjects
            If StrComp(NormName(lo.name), NormName(tblName), vbTextCompare) = 0 Then
                Set FindTable = lo: On Error GoTo 0: Exit Function
            End If
        Next lo
    Next ws
    On Error GoTo 0
End Function

Private Function FindSheet(wb As Workbook, ByVal nm As String) As Worksheet
    Dim ws As Worksheet
    For Each ws In wb.Worksheets
        If StrComp(NormName(ws.name), NormName(nm), vbTextCompare) = 0 Then Set FindSheet = ws: Exit Function
    Next ws
End Function

Private Function SheetExists(wb As Workbook, ByVal nm As String) As Boolean
    SheetExists = Not (FindSheet(wb, nm) Is Nothing)
End Function

' Normalize a name: strip non-breaking spaces (Chr 160) and trim - the usual
' cause of a tab that looks like "AllData" but won't match "AllData".
Private Function NormName(ByVal s As String) As String
    NormName = Trim$(Replace$(CStr(s), Chr$(160), " "))
End Function

Private Function InventoryText() As String
    Dim wb As Workbook, ws As Worksheet, lo As ListObject, s As String
    For Each wb In Application.Workbooks
        s = s & vbCrLf & "WB [" & wb.name & "]"
        For Each ws In wb.Worksheets
            s = s & vbCrLf & "   sheet [" & ws.name & "]"
            For Each lo In ws.ListObjects
                s = s & "  table[" & lo.name & "]"
            Next lo
        Next ws
    Next wb
    InventoryText = "Open workbooks / sheets / tables (brackets reveal hidden spaces):" & s
End Function

Private Sub LoadTableData(wbSrc As Workbook, ByRef vData As Variant, ByRef headers As Variant, _
                          ByRef nRows As Long, ByRef nCols As Long)
    Dim lo As ListObject, ws As Worksheet, ur As Range
    Set lo = FindTable(wbSrc, TABLE_NAME)
    If lo Is Nothing Then
        ' fall back to the data sheet; if it carries exactly one table, use that
        Set ws = FindSheet(wbSrc, DATA_SHEET)
        If Not ws Is Nothing Then
            If ws.ListObjects.Count = 1 Then Set lo = ws.ListObjects(1)
        End If
    End If
    If Not lo Is Nothing Then
        If lo.DataBodyRange Is Nothing Then Err.Raise vbObjectError + 10, , "Table '" & lo.name & "' has no data rows."
        headers = lo.HeaderRowRange.Value
        vData = lo.DataBodyRange.Value
    ElseIf Not ws Is Nothing Then
        Set ur = ws.UsedRange
        If ur.Rows.Count < 2 Then Err.Raise vbObjectError + 11, , "Sheet '" & ws.name & "' has no data rows."
        headers = ur.Rows(1).Value
        vData = ur.Offset(1, 0).Resize(ur.Rows.Count - 1, ur.Columns.Count).Value
    Else
        Err.Raise vbObjectError + 12, , "Neither table '" & TABLE_NAME & "' nor sheet '" & DATA_SHEET & _
            "' found in workbook '" & wbSrc.name & "'." & vbCrLf & vbCrLf & InventoryText()
    End If
    nRows = UBound(vData, 1)
    nCols = UBound(vData, 2)
End Sub

Private Function ColByHeader(headers As Variant, ByVal name As String) As Long
    Dim c As Long
    For c = LBound(headers, 2) To UBound(headers, 2)
        If StrComp(Trim$(CStr(headers(1, c))), name, vbTextCompare) = 0 Then
            ColByHeader = c: Exit Function
        End If
    Next c
    ColByHeader = 0
End Function

Private Function ReasonColumns(headers As Variant) As Collection
    Dim c As Long, h As String
    Dim col As Collection: Set col = New Collection
    For c = LBound(headers, 2) To UBound(headers, 2)
        h = UCase$(Trim$(CStr(headers(1, c))))
        If Len(h) >= 7 Then
            If Left$(h, 7) = "REASON " Then col.Add c
        End If
    Next c
    Set ReasonColumns = col
End Function

Private Function RecentLog(ByVal n As Long) As String
    Dim i As Long, startI As Long, s As String
    startI = gLogN - n
    If startI < 0 Then startI = 0
    For i = startI To gLogN - 1
        s = s & gLog(i) & vbCrLf
    Next i
    If Len(s) > 0 Then RecentLog = "Recent log:" & vbCrLf & s
End Function

Private Sub RemoveDefaults(wb As Workbook, defaults As Collection)
    Dim shObj As Object, dn As Variant
    Application.DisplayAlerts = False
    For Each dn In defaults
        If wb.Worksheets.Count > 1 Then
            On Error Resume Next
            Set shObj = Nothing
            Set shObj = wb.Worksheets(CStr(dn))
            If Not shObj Is Nothing Then shObj.Delete
            On Error GoTo 0
        End If
    Next dn
End Sub

Private Sub WriteRunLog(wb As Workbook, usedNames As Object, ByVal ok As Long, ByVal warn As Long, ByVal charts As Long)
    Dim ws As Worksheet, i As Long
    On Error Resume Next
    Set ws = wb.Worksheets.Add(Before:=wb.Worksheets(1))
    ws.name = UniqueSheetName(usedNames, "Run Log")
    ws.Range("A1").Value = "QA Manager Workbook - Run Log (v" & VERSION & ")"
    ws.Range("A1").Font.Bold = True
    ws.Range("A2").Value = "Generated:"
    ws.Range("B2").Value = Now
    ws.Range("A3").Value = "Tabs OK:":   ws.Range("B3").Value = ok
    ws.Range("A4").Value = "Warnings:":  ws.Range("B4").Value = warn
    ws.Range("A5").Value = "Charts:":    ws.Range("B5").Value = charts
    ws.Range("A7").Value = "Log:"
    ws.Range("A7").Font.Bold = True
    For i = 0 To gLogN - 1
        ws.Cells(8 + i, 1).Value = gLog(i)
    Next i
    ws.Columns("A").ColumnWidth = 90
    On Error GoTo 0
End Sub

Private Sub RestoreApp(ByVal su As Boolean, ByVal ev As Boolean, ByVal calc As Long, ByVal al As Boolean)
    On Error Resume Next
    Application.ScreenUpdating = su
    Application.EnableEvents = ev
    Application.Calculation = calc
    Application.DisplayAlerts = al
End Sub

Private Sub LogMsg(ByVal s As String)
    On Error Resume Next
    gLog.Add gLogN, Format(Timer - gT0, "0.0") & "s  " & s
    gLogN = gLogN + 1
    Debug.Print s
End Sub

Private Function NzTrim(v As Variant) As String
    If IsError(v) Then NzTrim = "": Exit Function
    If IsNull(v) Then NzTrim = "": Exit Function
    NzTrim = Trim$(CStr(v))
End Function

Private Function NzNum(v As Variant) As Double
    If IsEmpty(v) Then NzNum = 0: Exit Function
    If IsNumeric(v) Then NzNum = CDbl(v) Else NzNum = 0
End Function

Private Function MonthAbbrev(v As Variant) As String
    Dim s As String
    If IsEmpty(v) Or IsNull(v) Then MonthAbbrev = "": Exit Function
    If IsDate(v) Then
        MonthAbbrev = Application.WorksheetFunction.Proper(Format(v, "mmm"))
        Exit Function
    End If
    s = Trim$(CStr(v))
    If Len(s) = 0 Then MonthAbbrev = "": Exit Function
    s = Left$(s, 3)
    MonthAbbrev = UCase$(Left$(s, 1)) & LCase$(Mid$(s, 2))
End Function

Private Function MonthOrder(ByVal m As String) As Long
    Dim mn As Variant, i As Long
    mn = Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    For i = 0 To 11
        If StrComp(m, CStr(mn(i)), vbTextCompare) = 0 Then MonthOrder = i + 1: Exit Function
    Next i
    MonthOrder = 99
End Function

Private Function OrderedMonths(ms As Object) As String()
    Dim ks() As String, vs() As Double, i As Long, n As Long
    ks = ToStr0(ms.keys)
    n = UBound(ks) + 1
    ReDim vs(0 To n - 1)
    For i = 0 To n - 1
        vs(i) = CDbl(ms(ks(i)))
    Next i
    SortPairs ks, vs, True
    OrderedMonths = ks
End Function

Private Function ToStr0(v As Variant) As String()
    Dim n As Long, i As Long, b As Long
    Dim out() As String
    b = LBound(v)
    n = UBound(v) - b + 1
    If n < 1 Then
        ReDim out(0 To 0)
        out(0) = ""
        ToStr0 = out
        Exit Function
    End If
    ReDim out(0 To n - 1)
    For i = 0 To n - 1
        out(i) = CStr(v(b + i))
    Next i
    ToStr0 = out
End Function

Private Sub SortStringsAsc(arr() As String)
    Dim i As Long, j As Long, n As Long, ts As String
    n = UBound(arr)
    If n < 1 Then Exit Sub
    For i = 0 To n - 1
        For j = 0 To n - 1 - i
            If StrComp(arr(j), arr(j + 1), vbTextCompare) > 0 Then
                ts = arr(j): arr(j) = arr(j + 1): arr(j + 1) = ts
            End If
        Next j
    Next i
End Sub

Private Sub SortPairs(keys() As String, vals() As Double, ByVal ascending As Boolean)
    Dim i As Long, j As Long, n As Long, ts As String, tv As Double, sw As Boolean
    n = UBound(keys)
    If n < 1 Then Exit Sub
    For i = 0 To n - 1
        For j = 0 To n - 1 - i
            If ascending Then sw = (vals(j) > vals(j + 1)) Else sw = (vals(j) < vals(j + 1))
            If sw Then
                tv = vals(j): vals(j) = vals(j + 1): vals(j + 1) = tv
                ts = keys(j): keys(j) = keys(j + 1): keys(j + 1) = ts
            End If
        Next j
    Next i
End Sub

Private Function Join1(arr() As String) As String
    Dim i As Long, s As String
    For i = 0 To UBound(arr)
        If i > 0 Then s = s & ", "
        s = s & arr(i)
    Next i
    Join1 = s
End Function

Private Function UniqueSheetName(used As Object, ByVal nm As String) As String
    Dim base As String, cand As String, k As Long, suff As String
    base = SanitizeSheetName(nm)
    If Len(base) = 0 Then base = "Manager"
    cand = Left$(base, 31)
    k = 1
    Do While used.Exists(LCase$(cand))
        k = k + 1
        suff = " (" & k & ")"
        cand = Left$(base, 31 - Len(suff)) & suff
    Loop
    used.Add LCase$(cand), True
    UniqueSheetName = cand
End Function

Private Function SanitizeSheetName(ByVal s As String) As String
    Dim bad As Variant, i As Long
    s = Trim$(CStr(s))
    bad = Array(":", "\", "/", "?", "*", "[", "]")
    For i = LBound(bad) To UBound(bad)
        s = Replace$(s, CStr(bad(i)), " ")
    Next i
    Do While Len(s) > 0 And Left$(s, 1) = "'"
        s = Mid$(s, 2)
    Loop
    Do While Len(s) > 0 And Right$(s, 1) = "'"
        s = Left$(s, Len(s) - 1)
    Loop
    SanitizeSheetName = Trim$(s)
End Function
