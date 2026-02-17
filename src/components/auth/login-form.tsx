"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User } from "@/lib/types";
import { Chrome, Loader2, Trophy } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";

const ADMIN_EMAIL = "admin@supasport.com";
const ADMIN_PASSWORD = "Pavel@SuapSport";

const loginSchema = z.object({
  email: z.string().min(1, { message: "Email is required." }),
  password: z.string().min(6, { message: "Password is required." }),
});

const signUpSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export function LoginForm() {
  const [formType, setFormType] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const googleProvider = new GoogleAuthProvider();

  const currentSchema = formType === "login" ? loginSchema : signUpSchema;

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    form.reset();
  }, [formType, form]);

  const toggleFormType = () => {
    setFormType((prev) => (prev === "login" ? "signup" : "login"));
  };

  const ensureUserDoc = async (
    firebaseUser: FirebaseUser,
    role: "admin" | "coach" = "coach",
    displayName?: string
  ) => {
    if (!db) return role;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data().role as "admin" | "coach";
    }

    const newUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName || firebaseUser.displayName || "User",
      role,
      photoURL: firebaseUser.photoURL,
    };
    await setDoc(userDocRef, newUser);
    return role;
  };

  const redirectByRole = (role: "admin" | "coach") => {
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/coach/dashboard");
    }
  };

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    if (!auth || !db) return;
    try {
      const cred = await signInWithEmailAndPassword(auth, values.email, values.password);
      const role = await ensureUserDoc(cred.user);
      redirectByRole(role);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description:
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password" ||
          error.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function onSignUpSubmit(values: z.infer<typeof signUpSchema>) {
    setLoading(true);
    if (!auth || !db) return;

    try {
      const cred = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(cred.user, { displayName: values.name });

      await ensureUserDoc(cred.user, "coach", values.name);
      toast({ title: "Account Created", description: "Welcome to SupaSport!" });
      redirectByRole("coach");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description:
          error.code === "auth/email-already-in-use"
            ? "This email is already registered."
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = form.handleSubmit((data) => {
    if (formType === "login") {
      onLoginSubmit(data as z.infer<typeof loginSchema>);
    } else {
      onSignUpSubmit(data as z.infer<typeof signUpSchema>);
    }
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    if (!auth || !db) return;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const role = await ensureUserDoc(result.user);
      redirectByRole(role);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "Could not sign in with Google. Please try again.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    if (!auth || !db) return;
    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      } catch (error: any) {
        if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
          cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        } else {
          throw error;
        }
      }

      const userDocRef = doc(db, "users", cred.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        await setDoc(
          userDocRef,
          {
            uid: cred.user.uid,
            email: ADMIN_EMAIL,
            name: "Pavel (Admin)",
            role: "admin",
            photoURL: null,
          } as User,
          { merge: true }
        );
      }
      redirectByRole("admin");
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        variant: "destructive",
        title: "Admin Login Failed",
        description: "Could not log in as admin. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border-0">
      <div className="relative">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdminLogin}
            disabled={loading || googleLoading}
            className="text-xs text-muted-foreground"
          >
            Admin Login
          </Button>
        </div>
      </div>
      <CardHeader className="text-center pt-10">
        <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Trophy className="h-7 w-7 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {formType === "login" ? "SupaSport" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {formType === "login"
            ? "Welcome back! Sign in to manage your lessons."
            : "Sign up as a coach to get started."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {formType === "signup" && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="coach@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full !mt-6" disabled={loading || googleLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formType === "login" ? "Sign In" : "Sign Up"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {formType === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleFormType}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={toggleFormType}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
          Google
        </Button>
      </CardFooter>
    </Card>
  );
}
