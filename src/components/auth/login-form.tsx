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
  const [formType, setFormType] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const currentSchema = formType === 'login' ? loginSchema : signUpSchema;

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
  }, [formType]);

  const toggleFormType = () => {
    setFormType(prev => (prev === 'login' ? 'signup' : 'login'));
  };


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

  async function onLoginSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
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

  async function onSignUpSubmit(values: z.infer<typeof signUpSchema>) {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: values.name });

      const newUser: User = {
        uid: user.uid,
        email: user.email,
        name: values.name,
        role: "coach",
        photoURL: user.photoURL,
      };
      await setDoc(doc(db, "users", user.uid), newUser);
      
      toast({
          title: "Account Created",
          description: "You have successfully signed up.",
      });

      await handleAuthSuccess(user);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.code === 'auth/email-already-in-use'
                ? "This email is already registered."
                : "An unexpected error occurred. Please try again.",
        });
    } finally {
        setLoading(false);
    }
  }
  
  const onSubmit = form.handleSubmit((data) => {
    if (formType === 'login') {
      onLoginSubmit(data as z.infer<typeof loginSchema>);
    } else {
      onSignUpSubmit(data as z.infer<typeof signUpSchema>);
    }
  });


  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const newUser: User = {
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

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
        const userCredential = await signInWithEmailAndPassword(auth, "admin@supasport.com", "Pavel@SuapSport");
        await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            toast({
                variant: "destructive",
                title: "Admin Login Error",
                description: "Admin account not configured. Please contact support.",
            });
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            toast({
                variant: "destructive",
                title: "Invalid Credentials",
                description: "The admin password was incorrect.",
            });
        } else {
            console.error("Admin login error:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "An unexpected error occurred during admin login.",
            });
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
       <div className="relative">
        <div className="absolute top-4 right-4">
            <Button variant="link" onClick={handleAdminLogin} disabled={loading || googleLoading}>
                Continue as Admin
            </Button>
        </div>
      </div>
      <CardHeader className="text-center pt-12">
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
        <CardTitle className="text-3xl font-bold">
            {formType === 'login' ? 'SupaSport Hub' : 'Create an Account'}
        </CardTitle>
        <CardDescription>
          {formType === 'login' ? 'Welcome back! Please enter your details to login.' : 'Enter your details to create an account.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            {formType === 'signup' && (
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Name</FormLabel>
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
                    <Input
                      placeholder="e.g., coach@email.com"
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
            <Button type="submit" className="w-full !mt-6" disabled={loading || googleLoading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formType === 'login' ? 'Sign In' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              {formType === 'login' ? (
                  <>
                  Don't have an account?{" "}
                  <button type="button" onClick={toggleFormType} className="font-semibold text-primary hover:underline">
                      Sign up
                  </button>
                  </>
              ) : (
                  <>
                  Already have an account?{" "}
                  <button type="button" onClick={toggleFormType} className="font-semibold text-primary hover:underline">
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
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
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
