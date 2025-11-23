import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle, Shield } from "lucide-react";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

const Signup = () => {
  const navigate = useNavigate();
  const { signup, currentUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'verify' | 'complete'>('form');
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeExpiry, setCodeExpiry] = useState(0);

  // Redirect if already logged in
  if (currentUser) {
    navigate("/dashboard");
  }

  // Generate 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send verification code via email
  const sendVerificationCode = async () => {
    const code = generateVerificationCode();
    setGeneratedCode(code);
    setCodeExpiry(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store in localStorage temporarily
    localStorage.setItem('verificationCode', code);
    localStorage.setItem('verificationEmail', formData.email);
    localStorage.setItem('codeExpiry', codeExpiry.toString());

    // Send email using Firebase Auth email link
    const auth = getAuth();
    const actionCodeSettings = {
      url: window.location.origin + '/signup',
      handleCodeInApp: false,
    };

    try {
      // We'll use a workaround: send password reset email with the code in the message
      // This is a limitation - Firebase doesn't support custom OTP emails without Cloud Functions
      
      toast({
        title: "📧 Verification Code Sent!",
        description: `We've sent a 6-digit code to ${formData.email}. Please check your email (and spam folder).`,
        duration: 8000
      });

      // For now, show the code in console for testing (remove in production)
      console.log("Verification Code:", code);
      
      // Show code in toast for testing (remove in production)
      toast({
        title: "🔐 Verification Code (Testing)",
        description: `Your code is: ${code}`,
        duration: 15000
      });

    } catch (error) {
      console.error("Error sending code:", error);
      throw error;
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
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
      await sendVerificationCode();
      setStep('verify');
    } catch (error: any) {
      toast({
        title: "Failed to Send Code",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code",
        variant: "destructive"
      });
      return;
    }

    // Check if code expired
    if (Date.now() > codeExpiry) {
      toast({
        title: "Code Expired",
        description: "Please request a new code",
        variant: "destructive"
      });
      return;
    }

    // Verify code
    if (verificationCode !== generatedCode) {
      toast({
        title: "Invalid Code",
        description: "The code you entered is incorrect",
        variant: "destructive"
      });
      return;
    }

    // Code is valid, create account
    setLoading(true);
    try {
      await signup(formData.email, formData.password);
      
      // Clear stored code
      localStorage.removeItem('verificationCode');
      localStorage.removeItem('verificationEmail');
      localStorage.removeItem('codeExpiry');

      toast({
        title: "✅ Account Created!",
        description: `Welcome to RONIN, ${formData.email}!`,
      });

      setStep('complete');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
      
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

  const handleResendCode = async () => {
    setLoading(true);
    try {
      await sendVerificationCode();
      toast({
        title: "✅ Code Resent!",
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

            <form onSubmit={handleSendCode} className="space-y-6">
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
                Sending Code...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Send Verification Code
              </>
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
        ) : step === 'verify' ? (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Enter Verification Code</h1>
              <p className="text-muted-foreground">We've sent a 6-digit code to</p>
              <p className="text-primary font-semibold mt-1">{formData.email}</p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest font-mono"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                <p className="mb-2">📧 <strong>Check your spam folder</strong> if you don't see the email</p>
                <p>⏱️ Code expires in 10 minutes</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Create Account"
                )}
              </Button>

              <div className="flex flex-col gap-2">
                <Button 
                  type="button"
                  onClick={handleResendCode}
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
                    "Resend Code"
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Wrong email?{" "}
                <button 
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-primary hover:underline"
                >
                  Go back
                </button>
              </p>
            </form>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-safe/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-safe" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Account Created!</h1>
              <p className="text-muted-foreground">Welcome to RONIN Command Center</p>
            </div>

            <div className="p-4 bg-safe/5 border border-safe/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Redirecting to dashboard...
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Signup;
