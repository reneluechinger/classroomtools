import React, { useState, useCallback, useEffect, useRef } from 'react';
import { entities } from '@/api/db';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Shuffle, Save, Printer, Plus, Minus, PencilRuler, Eye,
  GraduationCap, Users, LayoutDashboard, Dices, Palette, Timer,
  QrCode, Lock, ListChecks, Mic, UsersRound, DoorOpen, Group,
} from 'lucide-react';
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
import BellButton from '@/components/seating/BellButton';
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
  const { data: seatingPlans = [] } = useQuery({
    queryKey: ['seatingPlans', currentUser?.email, selectedClassId, selectedLayoutId],
    queryFn: () => entities.SeatingPlan.filter({ classId: selectedClassId, layoutId: selectedLayoutId }),
    enabled: !!selectedClassId && !!selectedLayoutId,
  });

  // Auto-load newest seating plan when class+layout change
  useEffect(() => {
    if (!seatingPlans.length) return;
    // Sort by updated_date descending, pick newest
    const sorted = [...seatingPlans].sort((a, b) =>
      new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
    );
    const newest = sorted[0];
    if (newest && newest.id !== activePlanId) {
      setAssignments(newest.assignments || []);
      activePlanIdRef.current = newest.id;
      setActivePlanId(newest.id);
    }
  }, [seatingPlans]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 mr-auto">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Classroom Tools</h1>
          </div>
          <div className="flex items-center gap-4 flex-wrap order-3 w-full lg:order-none lg:w-auto">
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
          <UserMenu
            email={currentUser?.email}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(v => !v)}
            onShowChangelog={() => setShowChangelog(true)}
            onShowGuide={() => setShowGuide(true)}
          />
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Main Canvas Area */}
          <div className="space-y-4 min-w-0">
            {/* Toolbar */}
            <div className="bg-card border border-border rounded-xl divide-y divide-border">
              {/* Zeile 1: Sitzplan */}
              <div className="p-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20 shrink-0">Sitzplan</span>
                <Button
                  variant={isEditorMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={handleEditorModeToggle}
                  disabled={!selectedLayoutId}
                  title={selectedLayoutId ? '' : 'Zuerst ein Raumlayout wählen'}
                >
                  {isEditorMode ? <Eye className="w-4 h-4 mr-1" /> : <PencilRuler className="w-4 h-4 mr-1" />}
                  {isEditorMode ? 'Fertig' : 'Raum bearbeiten'}
                </Button>

                {isEditorMode ? (
                  <>
                    <div className="h-6 w-px bg-border mx-1" />
                    <Button variant="outline" size="sm" onClick={handleAddTable}>
                      <Plus className="w-4 h-4 mr-1" />Tisch
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRemoveTable} disabled={localTables.length === 0}>
                      <Minus className="w-4 h-4 mr-1" />Tisch
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleAddDoor}>
                      <DoorOpen className="w-4 h-4 mr-1" />Tür
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleRemoveDoor} disabled={localDoors.length === 0}>
                      <Minus className="w-4 h-4 mr-1" />Tür
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowTableGroups(true)}>
                      <Group className="w-4 h-4 mr-1" />Tischgruppen
                    </Button>
                    <Button
                      size="sm"
                      className="ml-auto"
                      onClick={handleSaveLayout}
                      disabled={!selectedLayoutId || !hasUnsavedChanges}
                    >
                      <Save className="w-4 h-4 mr-1" />Speichern
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant={genderMix ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setGenderMix(v => !v)}
                      aria-pressed={genderMix}
                      title="Wenn aktiv, sitzen möglichst Mädchen und Knaben nebeneinander"
                      className={genderMix ? 'ring-1 ring-primary/40' : ''}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Gemischt {genderMix ? 'an' : 'aus'}
                    </Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setShowPrint(true)}
                      disabled={!assignments.length}
                    >
                      <Printer className="w-4 h-4 mr-1" />Drucken
                    </Button>
                    <Button size="sm" className="ml-auto" onClick={handleGenerate} disabled={!selectedClassId || localTables.length === 0}>
                      <Shuffle className="w-4 h-4 mr-1" />Sitzplan generieren
                    </Button>
                  </>
                )}
              </div>

              {/* Zeile 2: Unterrichtswerkzeuge */}
              {!isEditorMode && (
                <div className="p-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground w-20 shrink-0">Unterricht</span>
                  <Button variant="outline" size="sm" onClick={pickRandomStudent} disabled={!hasStudents}>
                    <Dices className="w-4 h-4 mr-1" />Zufall
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowGroups(true)} disabled={!hasStudents}>
                    <UsersRound className="w-4 h-4 mr-1" />Gruppen
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowColorAssignment(true)} disabled={!hasStudents}>
                    <Palette className="w-4 h-4 mr-1" />Farben
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowTimer(true)}>
                    <Timer className="w-4 h-4 mr-1" />Timer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowNoiseMeter(true)}>
                    <Mic className="w-4 h-4 mr-1" />Lautstärke
                  </Button>
                  <BellButton />
                  <Button variant="outline" size="sm" onClick={() => setShowQRCode(true)}>
                    <QrCode className="w-4 h-4 mr-1" />QR-Code
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowTally(true)} disabled={!selectedClassId}>
                    <ListChecks className="w-4 h-4 mr-1" />Strichliste
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSEB(true)}>
                    <Lock className="w-4 h-4 mr-1" />SEB
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    onClick={handleArrangeAll}
                    title="Timer, QR-Code, Zufall und Lautstärke im 2×2-Raster öffnen"
                  >
                    <LayoutDashboard className="w-4 h-4 mr-1" />Alle anordnen
                  </Button>
                </div>
              )}
            </div>

            {/* Canvas */}
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

            {isEditorMode && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-center">
                  Ziehe Tische und Türen frei auf der Arbeitsfläche. Nutze ↺ / ↻ zum Drehen (15°-Schritte).
                </p>
                {hasUnsavedChanges && (
                  <p className="text-xs text-amber-600 text-center font-medium">⚠ Nicht gespeicherte Änderungen</p>
                )}
              </div>
            )}
            {!isEditorMode && assignments.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Ziehe Lernende per Drag & Drop auf andere Plätze, um sie umzusetzen.
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {needsSetup && !isEditorMode && <QuickGuide variant="card" />}

            {selectedClassId && selectedLayoutId && (
              <SeatingPlanPanel
                plans={seatingPlans}
                activePlanId={activePlanId}
                onLoad={handleLoadPlan}
                onDelete={(id) => deleteSeatingPlan.mutate(id)}
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
          </div>
        </div>
      </main>

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

      <footer className="text-center py-4 text-xs text-muted-foreground">
        © 2026 René Lüchinger · v{APP_VERSION}
      </footer>
    </div>
  );
}