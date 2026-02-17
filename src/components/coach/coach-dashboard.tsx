"use client";

import { useState, useMemo } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { format, isSameDay, addHours, setHours, setMinutes } from "date-fns";
import { useAuth, useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import type { User, Lesson, Client } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarDays,
  List,
  Plus,
  CheckCircle2,
  Clock,
  LogOut,
  Trash2,
  Trophy,
  UserPlus,
  Loader2,
} from "lucide-react";

interface CoachDashboardProps {
  user: User;
}

export function CoachDashboard({ user }: CoachDashboardProps) {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Booking form state
  const [selectedStartHour, setSelectedStartHour] = useState("9");
  const [selectedStartMinute, setSelectedStartMinute] = useState("00");
  const [selectedClientId, setSelectedClientId] = useState("");

  // New client form state
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  // Fetch lessons for this coach
  const lessonsQuery = useMemoFirebase(
    () =>
      db
        ? query(
            collection(db, "lessons"),
            where("coachId", "==", user.uid),
            orderBy("startTime", "asc")
          )
        : null,
    [db, user.uid]
  );
  const { data: allLessons, loading: lessonsLoading } = useCollection<Lesson>(lessonsQuery as any);

  // Fetch clients added by this coach
  const clientsQuery = useMemoFirebase(
    () =>
      db
        ? query(
            collection(db, "clients"),
            where("addedBy", "==", user.uid),
            orderBy("name", "asc")
          )
        : null,
    [db, user.uid]
  );
  const { data: clients, loading: clientsLoading } = useCollection<Client>(clientsQuery as any);

  // Filter lessons for selected date
  const lessonsForDate = useMemo(() => {
    if (!allLessons) return [];
    return allLessons.filter((lesson) => {
      const lessonDate = lesson.startTime.toDate();
      return isSameDay(lessonDate, selectedDate);
    });
  }, [allLessons, selectedDate]);

  // Dates that have lessons (for calendar dots)
  const lessonDates = useMemo(() => {
    if (!allLessons) return new Set<string>();
    const dates = new Set<string>();
    allLessons.forEach((l) => {
      dates.add(format(l.startTime.toDate(), "yyyy-MM-dd"));
    });
    return dates;
  }, [allLessons]);

  // Stats
  const completedToday = useMemo(() => {
    return lessonsForDate.filter((l) => l.status === "completed").length;
  }, [lessonsForDate]);

  const upcomingToday = useMemo(() => {
    return lessonsForDate.filter((l) => l.status === "upcoming").length;
  }, [lessonsForDate]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const handleBookLesson = async () => {
    if (!db || !selectedClientId) return;
    setBookingLoading(true);

    try {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Client not found");

      const startTime = setMinutes(
        setHours(selectedDate, parseInt(selectedStartHour)),
        parseInt(selectedStartMinute)
      );
      const endTime = addHours(startTime, 1);

      await addDoc(collection(db, "lessons"), {
        coachId: user.uid,
        clientId: client.id,
        clientName: client.name,
        startTime: Timestamp.fromDate(startTime),
        endTime: Timestamp.fromDate(endTime),
        status: "upcoming",
        createdAt: Timestamp.now(),
      });

      toast({ title: "Lesson Booked", description: `Lesson with ${client.name} at ${format(startTime, "h:mm a")}` });
      setBookDialogOpen(false);
      setSelectedClientId("");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to book lesson." });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleMarkDone = async (lessonId: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "lessons", lessonId), { status: "completed" });
      toast({ title: "Lesson Completed", description: "Lesson marked as done." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update lesson." });
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "lessons", lessonId));
      toast({ title: "Lesson Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete lesson." });
    }
  };

  const handleAddClient = async () => {
    if (!db || !newClientName.trim()) return;
    setBookingLoading(true);
    try {
      await addDoc(collection(db, "clients"), {
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: newClientPhone.trim(),
        addedBy: user.uid,
        createdAt: Timestamp.now(),
      });
      toast({ title: "Client Added", description: `${newClientName} has been added.` });
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPhone("");
      setAddClientDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add client." });
    } finally {
      setBookingLoading(false);
    }
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
  const minutes = ["00", "15", "30", "45"];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">SupaSport</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.name || user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedToday}</p>
                <p className="text-xs text-muted-foreground">Completed Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingToday}</p>
                <p className="text-xs text-muted-foreground">Upcoming Today</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle + Book Button */}
        <div className="flex items-center justify-between">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-1"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-1"
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
          <Button onClick={() => setBookDialogOpen(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Book Lesson
          </Button>
        </div>

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card>
            <CardContent className="p-2 sm:p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="mx-auto"
                modifiers={{
                  hasLesson: (date) => lessonDates.has(format(date, "yyyy-MM-dd")),
                }}
                modifiersClassNames={{
                  hasLesson: "bg-primary/20 font-bold",
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Lessons for Selected Date */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {viewMode === "calendar"
              ? `Lessons for ${format(selectedDate, "EEEE, MMM d")}`
              : "All Lessons"}
          </h2>

          {lessonsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {(viewMode === "calendar" ? lessonsForDate : allLessons || []).length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No lessons {viewMode === "calendar" ? "for this day" : "yet"}. Book one!
                  </CardContent>
                </Card>
              ) : (
                (viewMode === "calendar" ? lessonsForDate : allLessons || []).map((lesson) => (
                  <Card key={lesson.id} className={lesson.status === "completed" ? "opacity-75" : ""}>
                    <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            lesson.status === "completed" ? "bg-green-500" : "bg-blue-500"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{lesson.clientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(lesson.startTime.toDate(), "h:mm a")} -{" "}
                            {format(lesson.endTime.toDate(), "h:mm a")}
                            {viewMode === "list" && (
                              <span className="ml-2">
                                ({format(lesson.startTime.toDate(), "MMM d")})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {lesson.status === "completed" ? (
                          <Badge variant="secondary" className="text-green-600 bg-green-50">
                            Done
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkDone(lesson.id)}
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Done</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteLesson(lesson.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Book Lesson Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book a Lesson</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date</Label>
              <p className="text-sm font-medium mt-1">
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Hour</Label>
                <Select value={selectedStartHour} onValueChange={setSelectedStartHour}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => (
                      <SelectItem key={h} value={h.toString()}>
                        {h > 12 ? `${h - 12} PM` : h === 12 ? "12 PM" : `${h} AM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Minute</Label>
                <Select value={selectedStartMinute} onValueChange={setSelectedStartMinute}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minutes.map((m) => (
                      <SelectItem key={m} value={m}>
                        :{m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Client</Label>
              <div className="flex gap-2 mt-1">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : clients && clients.length > 0 ? (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No clients yet
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setAddClientDialogOpen(true)}
                  title="Add new client"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookLesson} disabled={!selectedClientId || bookingLoading}>
              {bookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Book Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={addClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="client@email.com"
                type="email"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                placeholder="+65 1234 5678"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddClientDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={!newClientName.trim() || bookingLoading}>
              {bookingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
