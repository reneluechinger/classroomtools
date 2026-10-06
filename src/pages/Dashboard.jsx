import React, { useState, useCallback, useEffect, useRef } from 'react';
import { entities } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shuffle, Printer, Eye, PencilRuler, DiceFive, UsersThree, Palette, Timer,
  Waveform, BellRinging, QrCode, ListChecks, LockKey, SquaresFour, SelectionPlus,
  ProjectorScreen, ArrowsIn, FloppyDisk,
} from '@phosphor-icons/react';
import { SegmentedControl, Stepper } from '@/components/ios';
import { Switch } from '@/components/ui/switch';
import ToolDock from '@/components/ToolDock';
import { playHotelBell } from '@/lib/bell';
import { useAuth } from '@/lib/AuthContext';
import UserMenu from '@/components/UserMenu';
import QuickGuide from '@/components/QuickGuide';

import ClassSelector from '@/components/seating/ClassSelector';
import LayoutSelector from '@/components/seating/LayoutSelector';
import RoomCanvas from '@/components/seating/RoomCanvas';
import StudentListPanel from '@/components/seating/StudentListPanel';
import CSVImportDialog from '@/components/seating/CSVImportDialog';
import BlacklistDialog from '@/components/seating/BlacklistDialog';
import MustSitTogetherDialog from '@/components/seating/MustSitTogetherDialog';
import TableGroupsDialog from '@/components/seating/TableGroupsDialog';
import FixedSeatDialog from '@/components/seating/FixedSeatDialog';
import PrintView from '@/components/seating/PrintView';
import RandomStudentOverlay from '@/components/seating/RandomStudentOverlay';
import ColorAssignmentOverlay from '@/components/seating/ColorAssignmentOverlay';
import TimeTimerOverlay from '@/components/seating/TimeTimerOverlay';
import GroupGeneratorOverlay from '@/components/seating/GroupGeneratorOverlay';
import SeatingPlanPanel from '@/components/seating/SeatingPlanPanel';
import QRCodePanel from '@/components/seating/QRCodePanel';
import NoiseMeterOverlay from '@/components/seating/NoiseMeterOverlay';
import TallyListOverlay from '@/components/seating/TallyListOverlay';
import SEBGenerator from '@/components/seating/SEBGenerator';
import ChangelogModal, { APP_VERSION } from '@/components/seating/ChangelogModal';
import { generateId, generateSeating } from '@/lib/seating';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Auth
  const { user: currentUser } = useAuth();

  // Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      return true;
    }
    return false;
  });
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showBlacklist, setShowBlacklist] = useState(false);
  const [showMustSitTogether, setShowMustSitTogether] = useState(false);
  const [showTableGroups, setShowTableGroups] = useState(false);
  const [showFixedSeats, setShowFixedSeats] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [randomStudent, setRandomStudent] = useState(null);
  const [showColorAssignment, setShowColorAssignment] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showNoiseMeter, setShowNoiseMeter] = useState(false);
  const [showTally, setShowTally] = useState(false);
  const [showSEB, setShowSEB] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);

  // Präsentieren: Vollbild, nur Raumplan und Dock
  const togglePresenting = () => {
    if (!isPresenting) {
      setIsPresenting(true);
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      setIsPresenting(false);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    }
  };
  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setIsPresenting(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);
  const [showGroups, setShowGroups] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [arrangeKey, setArrangeKey] = useState(0);
  const [genderMix, setGenderMix] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [activePlanId, setActivePlanId] = useState(null);
  const activePlanIdRef = useRef(null);
  const [localTables, setLocalTables] = useState([]);
  const [localDoors, setLocalDoors] = useState([]);
  const [localTableGroups, setLocalTableGroups] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track if we've applied auto-load (only once)
  const autoLoadApplied = useRef(false);

  // ─── App Settings (auto-load & changelog) ─────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ['appSettings', currentUser?.email],
    queryFn: () => entities.AppSettings.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
    staleTime: 60_000,
    select: (data) => data[0] || null,
  });
  const settings = settingsQuery.data;

  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => entities.AppSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] }),
  });
  const createSettings = useMutation({
    mutationFn: (data) => entities.AppSettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appSettings'] }),
  });

  const saveSettings = useCallback((patch) => {
    if (!currentUser) return;
    if (settings?.id) {
      updateSettings.mutate({ id: settings.id, data: patch });
    } else {
      createSettings.mutate({ userEmail: currentUser.email, ...patch });
    }
  }, [settings, currentUser]);

  // Apply auto-load once when settings + classes + layouts are ready
  const { data: classes = [] } = useQuery({
    queryKey: ['classes', currentUser?.email],
    queryFn: () => entities.SchoolClass.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
  });
  const { data: layouts = [] } = useQuery({
    queryKey: ['layouts', currentUser?.email],
    queryFn: () => entities.RoomLayout.filter({ created_by: currentUser.email }),
    enabled: !!currentUser,
  });

  useEffect(() => {
    if (autoLoadApplied.current) return;
    if (!settings || classes.length === 0 || layouts.length === 0) return;
    autoLoadApplied.current = true;

    if (settings.lastClassId && classes.find(c => c.id === settings.lastClassId)) {
      setSelectedClassId(settings.lastClassId);
    }
    if (settings.lastLayoutId && layouts.find(l => l.id === settings.lastLayoutId)) {
      setSelectedLayoutId(settings.lastLayoutId);
    }

    // Changelog check
    if (!settings.lastSeenVersion || settings.lastSeenVersion !== APP_VERSION) {
      setShowChangelog(true);
    }
  }, [settings, classes, layouts]);

  const handleAutoArrange = () => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const headerH = 60; // approximate header height
    const pad = 8;
    const halfW = Math.floor((W - pad * 3) / 2);
    const halfH = Math.floor((H - headerH - pad * 3) / 2);

    const positions = {
      time_timer:      { x: pad,              y: headerH + pad,              width: halfW, height: halfH },
      qr_code_panel:   { x: pad * 2 + halfW,  y: headerH + pad,              width: halfW, height: halfH },
      random_student:  { x: pad,              y: headerH + pad * 2 + halfH,  width: halfW, height: halfH },
      noise_meter:     { x: pad * 2 + halfW,  y: headerH + pad * 2 + halfH,  width: halfW, height: halfH },
    };

    Object.entries(positions).forEach(([key, val]) => {
      localStorage.setItem(`dw_${key}`, JSON.stringify(val));
    });
    setArrangeKey(k => k + 1); // force remount of windows
  };

  const handleCloseChangelog = () => {
    setShowChangelog(false);
    saveSettings({ lastSeenVersion: APP_VERSION });
  };

  // Persist class/layout selection to settings
  const handleSelectClass = (id) => {
    setSelectedClassId(id);
    saveSettings({ lastClassId: id });
  };
  const handleSelectLayout = (id) => {
    setSelectedLayoutId(id);
    saveSettings({ lastLayoutId: id });
  };

  // ─── Data queries ──────────────────────────────────────────────────────────
  const seatingPlansQuery = useQuery({
    queryKey: ['seatingPlans', currentUser?.email, selectedClassId, selectedLayoutId],
    queryFn: () => entities.SeatingPlan.filter({ classId: selectedClassId, layoutId: selectedLayoutId }),
    enabled: !!selectedClassId && !!selectedLayoutId,
  });

  const seatingPlans = seatingPlansQuery.data || [];

  // Beim Wechsel von Klasse oder Zimmer einmal laden: angehefteter Plan, sonst der neueste.
  // Danach nicht mehr automatisch springen, damit ein geöffneter älterer Plan offen bleibt.
  const loadedPlanKey = useRef(null);
  useEffect(() => {
    if (!selectedClassId || !selectedLayoutId || !seatingPlansQuery.isSuccess) return;
    const key = `${selectedClassId}|${selectedLayoutId}`;
    if (loadedPlanKey.current === key) return;
    loadedPlanKey.current = key;
    const pinned = seatingPlans.find(p => p.pinned);
    const newest = [...seatingPlans].sort((a, b) =>
      new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
    )[0];
    const plan = pinned || newest;
    setAssignments(plan?.assignments || []);
    activePlanIdRef.current = plan?.id || null;
    setActivePlanId(plan?.id || null);
  }, [selectedClassId, selectedLayoutId, seatingPlansQuery.isSuccess, seatingPlans]);

  const selectedClass = classes.find(c => c.id === selectedClassId);
  const selectedLayout = layouts.find(l => l.id === selectedLayoutId);

  // When layout changes, update local state
  useEffect(() => {
    if (selectedLayout) {
      setLocalTables(selectedLayout.tables || []);
      setLocalDoors(selectedLayout.doors || []);
      setLocalTableGroups(selectedLayout.tableGroups || []);
      setHasUnsavedChanges(false);
    } else {
      setLocalTables([]);
      setLocalDoors([]);
      setLocalTableGroups([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedLayout]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createClass = useMutation({
    mutationFn: (name) => entities.SchoolClass.create({ name, students: [], blacklist: [] }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setSelectedClassId(data.id);
      saveSettings({ lastClassId: data.id });
      toast.success('Klasse erstellt');
    }
  });

  const updateClass = useMutation({
    mutationFn: ({ id, data }) => entities.SchoolClass.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['classes'] }),
  });

  const deleteClass = useMutation({
    mutationFn: (id) => entities.SchoolClass.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      setSelectedClassId(null);
      saveSettings({ lastClassId: null });
      toast.success('Klasse gelöscht');
    }
  });

  const createLayout = useMutation({
    mutationFn: (name) => entities.RoomLayout.create({ name, tables: [], doors: [], tableGroups: [], canvasWidth: 900, canvasHeight: 650 }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setSelectedLayoutId(data.id);
      saveSettings({ lastLayoutId: data.id });
      toast.success('Raumvorlage erstellt');
    }
  });

  const updateLayout = useMutation({
    mutationFn: ({ id, data }) => entities.RoomLayout.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setHasUnsavedChanges(false);
      toast.success('Raumvorlage gespeichert');
    }
  });

  const deleteLayout = useMutation({
    mutationFn: (id) => entities.RoomLayout.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['layouts'] });
      setSelectedLayoutId(null);
      saveSettings({ lastLayoutId: null });
      toast.success('Raumvorlage gelöscht');
    }
  });

  const createSeatingPlan = useMutation({
    mutationFn: (data) => entities.SeatingPlan.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['seatingPlans'] });
      activePlanIdRef.current = data.id;
      setActivePlanId(data.id);
      toast.success('Sitzplan gespeichert!');
    }
  });

  const updateSeatingPlan = useMutation({
    mutationFn: ({ id, data }) => entities.SeatingPlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seatingPlans'] }),
  });

  const deleteSeatingPlan = useMutation({
    mutationFn: (id) => entities.SeatingPlan.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['seatingPlans'] });
      if (activePlanId === id) setActivePlanId(null);
      toast.success('Sitzplan gelöscht');
    }
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleImportStudents = (newStudents) => {
    if (!selectedClassId) return;
    const existing = selectedClass?.students || [];
    updateClass.mutate({ id: selectedClassId, data: { students: [...existing, ...newStudents] } });
    toast.success(`${newStudents.length} Schüler importiert`);
  };

  const handleRemoveStudent = (studentId) => {
    if (!selectedClassId) return;
    const students = (selectedClass?.students || []).filter(s => s.id !== studentId);
    const blacklist = (selectedClass?.blacklist || []).filter(
      b => b.studentA !== studentId && b.studentB !== studentId
    );
    updateClass.mutate({ id: selectedClassId, data: { students, blacklist } });
    setAssignments(prev => prev.filter(a => a.studentId !== studentId));
  };

  const handleUpdateBlacklist = (blacklist) => {
    if (!selectedClassId) return;
    updateClass.mutate({ id: selectedClassId, data: { blacklist } });
  };

  const handleUpdateMustSitTogether = (mustSitTogether) => {
    if (!selectedClassId) return;
    updateClass.mutate({ id: selectedClassId, data: { mustSitTogether } });
  };

  const handleUpdateStudents = (students) => {
    if (!selectedClassId) return;
    updateClass.mutate({ id: selectedClassId, data: { students } });
  };

  const handleAddTable = () => {
    const number = localTables.length + 1;
    const newTable = {
      id: generateId(),
      x: 100 + ((number - 1) % 4) * 180,
      y: 80 + Math.floor((number - 1) / 4) * 130,
      rotation: 0,
      number,
    };
    setLocalTables(prev => [...prev, newTable]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveTable = () => {
    if (localTables.length === 0) return;
    const removedTable = localTables[localTables.length - 1];
    setLocalTables(prev => prev.slice(0, -1));
    setLocalTableGroups(prev => prev.map(g => ({
      ...g,
      tableIds: g.tableIds.filter(id => id !== removedTable.id)
    })).filter(g => g.tableIds.length > 0));
    setHasUnsavedChanges(true);
  };

  const handleSaveLayout = () => {
    if (!selectedLayoutId) return;
    updateLayout.mutate({
      id: selectedLayoutId,
      data: { tables: localTables, doors: localDoors, tableGroups: localTableGroups }
    });
  };

  const handleAddDoor = () => {
    setLocalDoors(prev => [...prev, { id: generateId(), x: 50, y: 50 }]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveDoor = () => {
    if (localDoors.length === 0) return;
    setLocalDoors(prev => prev.slice(0, -1));
    setHasUnsavedChanges(true);
  };

  const handleUpdateTables = useCallback((newTables) => {
    setLocalTables(newTables);
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdateDoors = useCallback((newDoors) => {
    setLocalDoors(newDoors);
    setHasUnsavedChanges(true);
  }, []);

  const handleUpdateTableGroups = (newGroups) => {
    setLocalTableGroups(newGroups);
    setHasUnsavedChanges(true);
  };

  // Keep a ref in sync so saveAssignments always reads the latest planId
  const saveAssignments = useCallback((newAssignments, planId) => {
    const currentPlanId = planId !== undefined ? planId : activePlanIdRef.current;
    if (!selectedClassId || !selectedLayoutId) return;
    const planName = `${selectedClass?.name || ''} – ${selectedLayout?.name || ''} – ${new Date().toLocaleDateString('de-DE')}`;
    if (currentPlanId) {
      updateSeatingPlan.mutate({ id: currentPlanId, data: { assignments: newAssignments } });
    } else {
      createSeatingPlan.mutate({
        name: planName,
        classId: selectedClassId,
        layoutId: selectedLayoutId,
        assignments: newAssignments,
        genderSeparation: genderMix,
      });
    }
  }, [selectedClassId, selectedLayoutId, selectedClass, selectedLayout, genderMix]);

  const handleGenerate = () => {
    if (!selectedClass?.students?.length || localTables.length === 0) {
      toast.error('Wähle eine Klasse mit Schülern und ein Raumlayout.');
      return;
    }
    const newAssignments = generateSeating(
      selectedClass.students,
      localTables,
      {
        genderMix,
        blacklist: selectedClass.blacklist || [],
        mustSitTogether: selectedClass.mustSitTogether || [],
        tableGroups: localTableGroups
      }
    );
    setAssignments(newAssignments);
    activePlanIdRef.current = null;
    setActivePlanId(null);
    saveAssignments(newAssignments, null);
  };

  const handleSeatDrop = (fromSeatId, toSeatId) => {
    if (fromSeatId === toSeatId) return;
    const [fromTableId, fromIdx] = fromSeatId.split('-');
    const [toTableId, toIdx] = toSeatId.split('-');
    const fromSeatIndex = parseInt(fromIdx);
    const toSeatIndex = parseInt(toIdx);
    const fromAssignment = assignments.find(a => a.tableId === fromTableId && a.seatIndex === fromSeatIndex);
    const toAssignment = assignments.find(a => a.tableId === toTableId && a.seatIndex === toSeatIndex);
    if (!fromAssignment) return;
    let newAssignments = [...assignments];
    if (toAssignment) {
      newAssignments = newAssignments.map(a => {
        if (a.tableId === fromTableId && a.seatIndex === fromSeatIndex) return { ...a, tableId: toTableId, seatIndex: toSeatIndex };
        if (a.tableId === toTableId && a.seatIndex === toSeatIndex) return { ...a, tableId: fromTableId, seatIndex: fromSeatIndex };
        return a;
      });
    } else {
      newAssignments = newAssignments.map(a =>
        a.tableId === fromTableId && a.seatIndex === fromSeatIndex
          ? { ...a, tableId: toTableId, seatIndex: toSeatIndex }
          : a
      );
    }
    setAssignments(newAssignments);
    saveAssignments(newAssignments, activePlanIdRef.current);
  };

  // Nur ein Plan pro Klasse und Zimmer kann angeheftet sein
  const handleTogglePin = async (plan) => {
    const others = seatingPlans.filter(p => p.pinned && p.id !== plan.id);
    await Promise.all(others.map(p => entities.SeatingPlan.update(p.id, { pinned: false })));
    updateSeatingPlan.mutate({ id: plan.id, data: { pinned: !plan.pinned } });
    toast.success(plan.pinned ? 'Nicht mehr angeheftet' : 'Angeheftet: Dieser Plan öffnet sich künftig automatisch');
  };

  const handleRenamePlan = (plan, label) => {
    updateSeatingPlan.mutate({ id: plan.id, data: { label } });
  };

  const handleLoadPlan = (plan) => {
    setAssignments(plan.assignments || []);
    activePlanIdRef.current = plan.id;
    setActivePlanId(plan.id);
  };

  const handleEditorModeToggle = () => {
    if (isEditorMode && hasUnsavedChanges) {
      setShowSaveConfirm(true);
    } else {
      setIsEditorMode(!isEditorMode);
    }
  };

  const handleConfirmSave = () => {
    handleSaveLayout();
    setShowSaveConfirm(false);
    setIsEditorMode(false);
  };

  const handleDiscardChanges = () => {
    if (selectedLayout) {
      setLocalTables(selectedLayout.tables || []);
      setLocalDoors(selectedLayout.doors || []);
      setLocalTableGroups(selectedLayout.tableGroups || []);
    }
    setHasUnsavedChanges(false);
    setShowSaveConfirm(false);
    setIsEditorMode(false);
  };

  const hasStudents = !!selectedClass?.students?.length;
  const pickRandomStudent = () => {
    const students = selectedClass?.students || [];
    if (!students.length) return;
    setRandomStudent(students[Math.floor(Math.random() * students.length)]);
  };
  const handleArrangeAll = () => {
    setShowTimer(true);
    setShowQRCode(true);
    setRandomStudent(hasStudents
      ? selectedClass.students[Math.floor(Math.random() * selectedClass.students.length)]
      : { id: '_dummy', firstName: '?', lastName: '', gender: 'm' });
    setShowNoiseMeter(true);
    handleAutoArrange();
  };
  const needsSetup = !selectedClassId || !selectedLayoutId || localTables.length === 0 || !hasStudents;

  const toolItems = [
    { key: 'random', label: 'Zufall', icon: DiceFive, color: 'orange', onClick: pickRandomStudent, disabled: !hasStudents },
    { key: 'groups', label: 'Gruppen', icon: UsersThree, color: 'indigo', onClick: () => setShowGroups(true), disabled: !hasStudents },
    { key: 'colors', label: 'Farben', icon: Palette, color: 'pink', onClick: () => setShowColorAssignment(true), disabled: !hasStudents },
    { key: 'timer', label: 'Timer', icon: Timer, color: 'red', onClick: () => setShowTimer(true) },
    { key: 'noise', label: 'Lautstärke', icon: Waveform, color: 'green', onClick: () => setShowNoiseMeter(true) },
    { key: 'bell', label: 'Klingel', icon: BellRinging, color: 'yellow', onClick: playHotelBell, title: 'Aufmerksamkeit rufen' },
    { key: 'd1', divider: true },
    { key: 'qr', label: 'QR-Code', icon: QrCode, color: 'blue', onClick: () => setShowQRCode(true) },
    { key: 'tally', label: 'Strichliste', icon: ListChecks, color: 'teal', onClick: () => setShowTally(true), disabled: !selectedClassId },
    { key: 'seb', label: 'SEB', icon: LockKey, color: 'gray', onClick: () => setShowSEB(true), title: 'Safe Exam Browser' },
    { key: 'd2', divider: true },
    { key: 'arrange', label: 'Anordnen', icon: SquaresFour, color: 'purple', onClick: handleArrangeAll, title: 'Timer, QR-Code, Zufall und Lautstärke im 2×2-Raster' },
  ];

  const subtitle = [selectedLayout?.name, hasStudents ? `${selectedClass.students.length} Lernende` : null]
    .filter(Boolean).join(' · ');

  return (
    <div className={`min-h-screen bg-background flex flex-col ${isEditorMode ? 'pb-6' : 'pb-32'}`}>
      {/* Navigationsleiste */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl backdrop-saturate-150 border-b border-border/70">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="w-9 h-9 rounded-[10px] shadow-sm" />
            <span className="hidden md:block text-[17px] font-semibold tracking-tight">Classroom Tools</span>
          </div>
          {!isPresenting && (
            <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar md:ml-4">
              <ClassSelector
                classes={classes}
                selectedClassId={selectedClassId}
                onSelect={handleSelectClass}
                onCreate={(name) => createClass.mutate(name)}
                onDelete={(id) => deleteClass.mutate(id)}
                onRename={(id, name) => updateClass.mutate({ id, data: { name } })}
              />
              <LayoutSelector
                layouts={layouts}
                selectedLayoutId={selectedLayoutId}
                onSelect={handleSelectLayout}
                onCreate={(name) => createLayout.mutate(name)}
                onDelete={(id) => deleteLayout.mutate(id)}
                onRename={(id, name) => updateLayout.mutate({ id, data: { name } })}
              />
            </div>
          )}
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="sm"
              onClick={togglePresenting}
              disabled={isEditorMode}
              title={isPresenting ? 'Präsentation beenden' : 'Präsentieren: Vollbild für den Beamer'}
            >
              {isPresenting ? <ArrowsIn size={18} weight="bold" /> : <ProjectorScreen size={18} weight="bold" />}
              <span className="hidden sm:inline">{isPresenting ? 'Beenden' : 'Präsentieren'}</span>
            </Button>
            {!isPresenting && (
              <UserMenu
                email={currentUser?.email}
                isDarkMode={isDarkMode}
                onToggleDarkMode={() => setIsDarkMode(v => !v)}
                onShowChangelog={() => setShowChangelog(true)}
                onShowGuide={() => setShowGuide(true)}
              />
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] w-full mx-auto px-4 pt-5 flex-1">
        <div className={`grid grid-cols-1 gap-6 ${isPresenting ? '' : 'lg:grid-cols-[1fr_320px]'}`}>
          <div className="space-y-4 min-w-0">
            {/* Grosser Titel */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <h1 className="text-[32px] leading-tight font-bold tracking-tight truncate">
                  {selectedClass?.name || 'Sitzplan'}
                </h1>
                <p className="text-[15px] text-muted-foreground truncate">
                  {subtitle || 'Wähle oben eine Klasse und ein Zimmer'}
                </p>
              </div>

              {!isPresenting && (
                <SegmentedControl
                  value={isEditorMode ? 'edit' : 'plan'}
                  onChange={(v) => { if ((v === 'edit') !== isEditorMode) handleEditorModeToggle(); }}
                  options={[
                    { value: 'plan', label: 'Sitzplan', icon: Eye },
                    { value: 'edit', label: 'Zimmer bearbeiten', icon: PencilRuler, disabled: !selectedLayoutId },
                  ]}
                />
              )}
            </div>

            {/* Steuerleiste */}
            {!isPresenting && (
              <div className="bg-card rounded-xl px-4 py-2.5 flex items-center gap-x-5 gap-y-2 flex-wrap min-h-[52px]">
                {isEditorMode ? (
                  <>
                    <Stepper label="Tische" value={localTables.length} onInc={handleAddTable} onDec={handleRemoveTable} decDisabled={!localTables.length} />
                    <Stepper label="Türen" value={localDoors.length} onInc={handleAddDoor} onDec={handleRemoveDoor} decDisabled={!localDoors.length} />
                    <Button variant="secondary" size="sm" onClick={() => setShowTableGroups(true)}>
                      <SelectionPlus size={16} weight="bold" />Tischgruppen
                    </Button>
                    <div className="ml-auto flex items-center gap-3">
                      {hasUnsavedChanges && <span className="text-[13px] text-[#FF9500]">Nicht gesichert</span>}
                      <Button size="sm" className="rounded-full px-4" onClick={handleSaveLayout} disabled={!selectedLayoutId || !hasUnsavedChanges}>
                        <FloppyDisk size={16} weight="fill" />Sichern
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="flex items-center gap-2.5 text-[15px] cursor-pointer select-none" title="Möglichst Mädchen und Knaben nebeneinander">
                      <Switch checked={genderMix} onCheckedChange={setGenderMix} />
                      Gemischt
                    </label>
                    <div className="ml-auto flex items-center gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setShowPrint(true)} disabled={!assignments.length}>
                        <Printer size={16} weight="bold" />Drucken
                      </Button>
                      <Button size="sm" className="rounded-full px-4" onClick={handleGenerate} disabled={!selectedClassId || localTables.length === 0}>
                        <Shuffle size={16} weight="bold" />Neu mischen
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Raum so gross wie möglich, aber ganz sichtbar (Höhe begrenzt die Breite) */}
            <div
              className="mx-auto w-full"
              style={{ maxWidth: `calc((100vh - ${isPresenting ? 250 : 330}px) * 900 / 650)`, minWidth: 'min(100%, 320px)' }}
            >
            <RoomCanvas
              tables={localTables}
              onUpdateTables={handleUpdateTables}
              students={selectedClass?.students || []}
              assignments={assignments}
              isEditorMode={isEditorMode}
              onSeatDrop={handleSeatDrop}
              doors={localDoors}
              onUpdateDoors={handleUpdateDoors}
            />
            </div>

            {!isPresenting && (
              <p className="text-[13px] text-muted-foreground text-center">
                {isEditorMode
                  ? 'Tische und Türen ziehen. Mit ↺ ↻ drehen.'
                  : assignments.length > 0 ? 'Lernende per Drag & Drop umsetzen.' : ''}
              </p>
            )}
          </div>

          {!isPresenting && (
            <aside className="space-y-6">
              {needsSetup && !isEditorMode && <QuickGuide variant="card" />}

              {selectedClassId && selectedLayoutId && (
                <SeatingPlanPanel
                  plans={seatingPlans}
                  activePlanId={activePlanId}
                  onLoad={handleLoadPlan}
                  onDelete={(id) => deleteSeatingPlan.mutate(id)}
                  onTogglePin={handleTogglePin}
                  onRename={handleRenamePlan}
                />
              )}

              {selectedClassId && (
                <StudentListPanel
                  students={selectedClass?.students || []}
                  assignments={assignments}
                  onOpenImport={() => setShowImport(true)}
                  onOpenBlacklist={() => setShowBlacklist(true)}
                  onOpenMustSitTogether={() => setShowMustSitTogether(true)}
                  onOpenFixedSeats={() => setShowFixedSeats(true)}
                  onRemoveStudent={handleRemoveStudent}
                />
              )}
            </aside>
          )}
        </div>
      </main>

      {!isEditorMode && <ToolDock items={toolItems} />}

      {/* Dialogs */}
      <CSVImportDialog open={showImport} onOpenChange={setShowImport} onImport={handleImportStudents} />
      <BlacklistDialog
        open={showBlacklist} onOpenChange={setShowBlacklist}
        students={selectedClass?.students || []}
        blacklist={selectedClass?.blacklist || []}
        onUpdate={handleUpdateBlacklist}
      />
      <MustSitTogetherDialog
        open={showMustSitTogether} onOpenChange={setShowMustSitTogether}
        students={selectedClass?.students || []}
        mustSitTogether={selectedClass?.mustSitTogether || []}
        onUpdate={handleUpdateMustSitTogether}
      />
      <TableGroupsDialog
        open={showTableGroups} onOpenChange={setShowTableGroups}
        tables={localTables}
        tableGroups={localTableGroups}
        onUpdate={handleUpdateTableGroups}
      />
      <FixedSeatDialog
        open={showFixedSeats} onOpenChange={setShowFixedSeats}
        students={selectedClass?.students || []}
        tables={localTables}
        onUpdate={handleUpdateStudents}
      />

      <AlertDialog open={showSaveConfirm} onOpenChange={setShowSaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Änderungen speichern?</AlertDialogTitle>
            <AlertDialogDescription>
              Du hast nicht gespeicherte Änderungen am Raumlayout. Möchtest du diese speichern bevor du den Editor verlässt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>Verwerfen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Speichern</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {randomStudent && (
        <RandomStudentOverlay
          key={`random-${arrangeKey}`}
          student={randomStudent}
          students={selectedClass?.students || []}
          onClose={() => setRandomStudent(null)}
        />
      )}
      {showColorAssignment && (
        <ColorAssignmentOverlay students={selectedClass?.students || []} onClose={() => setShowColorAssignment(false)} />
      )}
      {showTimer && <TimeTimerOverlay key={`timer-${arrangeKey}`} onClose={() => setShowTimer(false)} />}
      {showNoiseMeter && (
        <NoiseMeterOverlay key={`noise-${arrangeKey}`} onClose={() => setShowNoiseMeter(false)} currentUser={currentUser} />
      )}
      {showTally && (
        <TallyListOverlay classes={classes} onClose={() => setShowTally(false)} currentUser={currentUser} />
      )}
      {showGroups && (
        <GroupGeneratorOverlay students={selectedClass?.students || []} onClose={() => setShowGroups(false)} />
      )}
      {showChangelog && <ChangelogModal onClose={handleCloseChangelog} />}
      {showSEB && <SEBGenerator open={showSEB} onClose={() => setShowSEB(false)} />}
      <QRCodePanel key={`qr-${arrangeKey}`} currentUser={currentUser} open={showQRCode} onClose={() => setShowQRCode(false)} />

      {showPrint && (
        <PrintView
          tables={localTables}
          students={selectedClass?.students || []}
          assignments={assignments}
          className={selectedClass?.name || ''}
          layoutName={selectedLayout?.name || ''}
          onClose={() => setShowPrint(false)}
        />
      )}
      {showGuide && <QuickGuide variant="dialog" onClose={() => setShowGuide(false)} />}

      <footer className={`text-center py-4 text-xs text-muted-foreground ${isPresenting ? 'hidden' : ''}`}>
        © 2026 René Lüchinger · v{APP_VERSION}
      </footer>
    </div>
  );
}