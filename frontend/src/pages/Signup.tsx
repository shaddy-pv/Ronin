import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle } from "lucide-react";
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
  const [emailVerified, setEmailVerified] = useState(false);

  // Redirect if already logged in
  if (currentUser) {
    navigate("/dashboard");
  }

  // Check if user is coming back from email verification link
  useEffect(() => {
    const auth = getAuth();
    
    if (isSignInWithEmailLink(auth, window.location.href)) {
      // User clicked verification link
      let email = window.localStorage.getItem('emailForSignIn');
      
      if (!email) {
        // Ask user for email if not found
        email = window.prompt('Please provide your email for confirmation');
      }
      
      if (email) {
        setLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            // Email verified successfully
            window.localStorage.removeItem('emailForSignIn');
            setEmailVerified(true);
            
            // Get stored form data
            const storedData = localStorage.getItem('signupFormData');
            if (storedData) {
              const data = JSON.parse(storedData);
              setFormData(data);
              setStep('complete');
              
              toast({
                title: "✅ Email Verified!",
                description: "Creating your account now...",
              });
              
              // Create account
              signup(data.email, data.password)
                .then(() => {
                  localStorage.removeItem('signupFormData');
                  toast({
                    title: "🎉 Account Created!",
                    description: `Welcome to RONIN, ${data.email}!`,
                  });
                  setTimeout(() => navigate("/dashboard"), 2000);
                })
                .catch((error) => {
                  toast({
                    title: "Signup Failed",
                    description: error.message,
                    variant: "destructive"
                  });
                  setStep('form');
                });
            }
          })
          .catch((error) => {
            console.error("Email verification error:", error);
            toast({
              title: "Verification Failed",
              description: "Invalid or expired link. Please try again.",
              variant: "destructive"
            });
            setStep('form');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [signup, navigate, toast]);

  const handleSendVerificationLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.fullName) {
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
      const auth = getAuth();
      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true,
      };

      // Send verification email link
      await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings);
      
      // Store email and form data for later
      window.localStorage.setItem('emailForSignIn', formData.email);
      localStorage.setItem('signupFormData', JSON.stringify(formData));

      setStep('verify');
      
      toast({
        title: "📧 Verification Email Sent!",
        description: `Please check your email at ${formData.email} and click the verification link.`,
        duration: 10000
      });
    } catch (error: any) {
      console.error("Error sending verification:", error);
      let errorMessage = "Failed to send verification email.";
      
      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      toast({
        title: "Failed to Send Email",
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
      const auth = getAuth();
      const actionCodeSettings = {
        url: window.location.origin + '/signup',
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings);
      
      toast({
        title: "✅ Email Resent!",
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

            <form onSubmit={handleSendVerificationLink} className="space-y-6">
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
                Sending Verification Email...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Verification Email
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
                <Mail className="w-8 h-8 text-primary animate-pulse" />
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
                    <p className="font-semibold mb-1">Click the link in your email</p>
                    <p className="text-muted-foreground">
                      Open the email we sent to {formData.email} and click the verification link. You'll be redirected back here to complete signup.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
                <p>📧 <strong>Check your spam folder</strong> if you don't see the email</p>
                <p>⏱️ The link expires in 1 hour</p>
                <p>🔄 After clicking the link, your account will be created automatically</p>
              </div>

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

              <p className="text-center text-sm text-muted-foreground mt-4">
                Wrong email?{" "}
                <button 
                  type="button"
                  onClick={() => {
                    setStep('form');
                    localStorage.removeItem('emailForSignIn');
                    localStorage.removeItem('signupFormData');
                  }}
                  className="text-primary hover:underline"
                >
                  Go back
                </button>
              </p>
            </div>
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
