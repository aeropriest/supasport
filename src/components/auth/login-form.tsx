"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  User as FirebaseUser,
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
import { auth, googleProvider, db } from "@/lib/firebase";
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
import { Chrome, Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().min(1, { message: "Email or Phone Number is required." }),
  password: z.string().min(6, { message: "Password is required." }),
});

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthSuccess = async (firebaseUser: FirebaseUser) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    let userRole: "admin" | "coach" = "coach";

    if (userDoc.exists()) {
      userRole = userDoc.data().role;
    }

    if (
      (firebaseUser.email === "+6598503941" ||
        firebaseUser.email === "admin@supasport.com")
    ) {
      if (!userDoc.exists() || userDoc.data().role !== "admin") {
        await setDoc(
          userDocRef,
          { role: "admin" },
          { merge: true }
        );
      }
      userRole = "admin";
    }

    if (userRole === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/coach/dashboard");
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const { email, password } = values;

    // Hardcoded admin check
    if (
      (email === "+6598503941" || email === "admin@supasport.com") &&
      password === "Pavel@SuapSport"
    ) {
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          "admin@supasport.com",
          password
        );
        await handleAuthSuccess(userCredential.user);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          // If admin account does not exist, this is likely a first-time setup.
          // We can't create it here securely. This is a manual process.
          // For this app, we'll show an error.
           toast({
            variant: "destructive",
            title: "Admin Login Error",
            description: "Admin account not configured. Please contact support.",
          });
        } else if (error.code === 'auth/wrong-password') {
             toast({
                variant: "destructive",
                title: "Invalid Credentials",
                description: "Please check your password and try again.",
            });
        }
        else {
          console.error("Admin login error:", error);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: "An unexpected error occurred.",
          });
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Coach login
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      await handleAuthSuccess(userCredential.user);
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser: Omit<User, 'id'> = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          role: "coach",
          photoURL: user.photoURL,
        };
        await setDoc(userDocRef, newUser);
      }
      await handleAuthSuccess(user);
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

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
        <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v2h-2v-2zm0 4h2v6h-2v-6z"
              fill="currentColor"
            />
          </svg>
        </div>
        <CardTitle className="text-3xl font-bold">SupaSport Hub</CardTitle>
        <CardDescription>
          Welcome back! Please enter your details to login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email or Phone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., coach@email.com or +6598503941"
                      {...field}
                    />
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
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
