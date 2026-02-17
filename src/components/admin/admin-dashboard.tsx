"use client";

import { useState, useMemo } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { format, isSameDay } from "date-fns";
import { useAuth, useFirestore } from "@/firebase";
import { useCollection } from "@/firebase/firestore/use-collection";
import { useMemoFirebase } from "@/firebase/firestore/use-memo-firebase";
import type { User, Lesson, Client } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Trophy,
  LogOut,
  Users,
  CalendarDays,
  CheckCircle2,
  Clock,
  UserCircle,
  Loader2,
  BookOpen,
  ChevronRight,
} from "lucide-react";

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("coaches");
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [coachCalendarDate, setCoachCalendarDate] = useState<Date>(new Date());
  const [coachDialogOpen, setCoachDialogOpen] = useState(false);

  // Fetch all coaches
  const coachesQuery = useMemoFirebase(
    () =>
      db
        ? query(
            collection(db, "users"),
            where("role", "==", "coach")
          )
        : null,
    [db]
  );
  const { data: coaches, loading: coachesLoading } = useCollection<User>(coachesQuery as any);

  // Fetch all lessons
  const allLessonsQuery = useMemoFirebase(
    () =>
      db
        ? query(collection(db, "lessons"), orderBy("startTime", "desc"))
        : null,
    [db]
  );
  const { data: allLessons, loading: lessonsLoading } = useCollection<Lesson>(allLessonsQuery as any);

  // Fetch all clients
  const allClientsQuery = useMemoFirebase(
    () =>
      db
        ? query(collection(db, "clients"), orderBy("name", "asc"))
        : null,
    [db]
  );
  const { data: allClients, loading: clientsLoading } = useCollection<Client>(allClientsQuery as any);

  // Stats
  const todayStats = useMemo(() => {
    if (!allLessons) return { completed: 0, upcoming: 0, total: 0 };
    const today = new Date();
    const todayLessons = allLessons.filter((l) =>
      isSameDay(l.startTime.toDate(), today)
    );
    return {
      completed: todayLessons.filter((l) => l.status === "completed").length,
      upcoming: todayLessons.filter((l) => l.status === "upcoming").length,
      total: todayLessons.length,
    };
  }, [allLessons]);

  // Lessons per coach for today
  const coachStats = useMemo(() => {
    if (!allLessons || !coaches) return new Map<string, { completed: number; upcoming: number }>();
    const today = new Date();
    const stats = new Map<string, { completed: number; upcoming: number }>();
    coaches.forEach((c) => stats.set(c.uid, { completed: 0, upcoming: 0 }));
    allLessons.forEach((l) => {
      if (isSameDay(l.startTime.toDate(), today)) {
        const s = stats.get(l.coachId) || { completed: 0, upcoming: 0 };
        if (l.status === "completed") s.completed++;
        else s.upcoming++;
        stats.set(l.coachId, s);
      }
    });
    return stats;
  }, [allLessons, coaches]);

  // Lessons for selected coach
  const selectedCoachLessons = useMemo(() => {
    if (!allLessons || !selectedCoach) return [];
    return allLessons.filter((l) => l.coachId === selectedCoach.uid);
  }, [allLessons, selectedCoach]);

  const selectedCoachLessonsForDate = useMemo(() => {
    return selectedCoachLessons.filter((l) =>
      isSameDay(l.startTime.toDate(), coachCalendarDate)
    );
  }, [selectedCoachLessons, coachCalendarDate]);

  const selectedCoachLessonDates = useMemo(() => {
    const dates = new Set<string>();
    selectedCoachLessons.forEach((l) => {
      dates.add(format(l.startTime.toDate(), "yyyy-MM-dd"));
    });
    return dates;
  }, [selectedCoachLessons]);

  // Clients per coach map
  const clientsByCoach = useMemo(() => {
    if (!allClients) return new Map<string, number>();
    const map = new Map<string, number>();
    allClients.forEach((c) => {
      map.set(c.addedBy, (map.get(c.addedBy) || 0) + 1);
    });
    return map;
  }, [allClients]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      router.push("/login");
    }
  };

  const openCoachDetail = (coach: User) => {
    setSelectedCoach(coach);
    setCoachCalendarDate(new Date());
    setCoachDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">SupaSport</span>
            <Badge variant="secondary" className="text-xs">Admin</Badge>
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

      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.completed}</p>
                <p className="text-xs text-muted-foreground">Done Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStats.upcoming}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{coaches?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Coaches</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="coaches" className="gap-1">
              <Users className="h-4 w-4" />
              Coaches
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1">
              <BookOpen className="h-4 w-4" />
              Clients
            </TabsTrigger>
          </TabsList>

          {/* Coaches Tab */}
          <TabsContent value="coaches" className="mt-4">
            {coachesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !coaches || coaches.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No coaches registered yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {coaches.map((coach) => {
                  const stats = coachStats.get(coach.uid) || { completed: 0, upcoming: 0 };
                  return (
                    <Card
                      key={coach.uid}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openCoachDetail(coach)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{coach.name || "Unnamed Coach"}</p>
                            <p className="text-sm text-muted-foreground truncate">{coach.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-green-600 font-medium">{stats.completed} done</span>
                              <span className="text-muted-foreground">|</span>
                              <span className="text-blue-600 font-medium">{stats.upcoming} upcoming</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {clientsByCoach.get(coach.uid) || 0} clients
                            </p>
                          </div>
                          <div className="sm:hidden flex flex-col items-center">
                            <Badge variant="secondary" className="text-xs">{stats.completed + stats.upcoming}</Badge>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-4">
            {clientsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !allClients || allClients.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No clients in the database yet.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead className="hidden sm:table-cell">Phone</TableHead>
                        <TableHead>Added By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allClients.map((client) => {
                        const coach = coaches?.find((c) => c.uid === client.addedBy);
                        return (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell className="hidden sm:table-cell">{client.email || "-"}</TableCell>
                            <TableCell className="hidden sm:table-cell">{client.phone || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {coach?.name || "Unknown"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Coach Detail Dialog */}
      <Dialog open={coachDialogOpen} onOpenChange={setCoachDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {selectedCoach?.name || "Coach"}
            </DialogTitle>
          </DialogHeader>

          {selectedCoach && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedCoach.email}</p>

              {/* Coach Calendar */}
              <Card>
                <CardContent className="p-2">
                  <Calendar
                    mode="single"
                    selected={coachCalendarDate}
                    onSelect={(date) => date && setCoachCalendarDate(date)}
                    className="mx-auto"
                    modifiers={{
                      hasLesson: (date) =>
                        selectedCoachLessonDates.has(format(date, "yyyy-MM-dd")),
                    }}
                    modifiersClassNames={{
                      hasLesson: "bg-primary/20 font-bold",
                    }}
                  />
                </CardContent>
              </Card>

              {/* Lessons for selected date */}
              <div>
                <h3 className="font-semibold text-sm mb-2">
                  Lessons on {format(coachCalendarDate, "MMM d, yyyy")}
                </h3>
                {selectedCoachLessonsForDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No lessons on this day.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedCoachLessonsForDate
                      .sort((a, b) => a.startTime.toMillis() - b.startTime.toMillis())
                      .map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                lesson.status === "completed" ? "bg-green-500" : "bg-blue-500"
                              }`}
                            />
                            <div>
                              <p className="text-sm font-medium">{lesson.clientName}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(lesson.startTime.toDate(), "h:mm a")} -{" "}
                                {format(lesson.endTime.toDate(), "h:mm a")}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={lesson.status === "completed" ? "default" : "secondary"}
                            className={
                              lesson.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : ""
                            }
                          >
                            {lesson.status === "completed" ? "Done" : "Upcoming"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* All-time stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">All-Time Stats</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedCoachLessons.filter((l) => l.status === "completed").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedCoachLessons.filter((l) => l.status === "upcoming").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Upcoming</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
