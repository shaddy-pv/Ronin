import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { getAuth } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, currentUser, sendVerificationEmail } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  // Redirect if already logged in
  if (currentUser) {
    navigate("/dashboard");
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create account
      await signup(formData.email, formData.password);
      
      // Send verification email immediately
      try {
        await sendVerificationEmail();
        setVerificationSent(true);
        setStep('verify');
        toast({
          title: "✅ Verification Email Sent!",
          description: `Please check your email at ${formData.email} and click the verification link to complete signup.`,
          duration: 10000
        });
      } catch (verifyError: any) {
        console.error("Verification email error:", verifyError);
        
        // Show specific error message
        let errorMsg = "Could not send verification email. ";
        if (verifyError.code === "auth/too-many-requests") {
          errorMsg += "Too many requests. Please try again later.";
        } else if (verifyError.code === "auth/invalid-email") {
          errorMsg += "Invalid email address.";
        } else {
          errorMsg += "Please check your email settings.";
        }
        
        toast({
          title: "Verification Email Failed",
          description: errorMsg,
          variant: "destructive"
        });
        
        // Still show verify step
        setStep('verify');
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      }
      
      toast({
        title: "Signup Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "✅ Verification Email Resent!",
        description: `Check your email at ${formData.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
        description: "Please try again in a few moments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Subtle pattern background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--foreground)) 10px, hsl(var(--foreground)) 11px)`
      }} />
      
      <div className="w-full max-w-md p-8 bg-card border border-border rounded-lg relative z-10">
        {step === 'form' ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Create Account</h1>
              <p className="text-muted-foreground">Join RONIN Command Center</p>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="John Operator"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="operator@ronin.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
              <p className="text-muted-foreground">We've sent a verification link to</p>
              <p className="text-primary font-semibold mt-1">{formData.email}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Check your email</p>
                    <p className="text-muted-foreground">
                      Click the verification link in the email we sent to {formData.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="mb-2">📧 <strong>Check your spam folder</strong> if you don't see the email</p>
                <p>⏱️ The link expires in 1 hour</p>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleResendVerification}
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>

                <Button 
                  onClick={handleContinueToDashboard}
                  className="w-full"
                >
                  Continue to Dashboard
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Wrong email?{" "}
                <button 
                  onClick={() => setStep('form')}
                  className="text-primary hover:underline"
                >
                  Go back
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
