import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Lock, Mail, Eye, EyeOff } from "lucide-react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase/firebaseConfig"
import logo from "../assets/favicon.png"
import styles from "./Login.module.css"
import { useCookies } from "react-cookie"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [, setCookies] = useCookies(["userAuthenticated"])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      const user = await signInWithEmailAndPassword(auth, email, password)
      setCookies("userAuthenticated", user.user.uid, {
        path: "/",
        expires: new Date(new Date().getTime() + 15 * 60 * 1000),
        secure: true,
        sameSite: "strict",
      })
      navigate("/", { replace: true })
    } catch (err) {
      console.error("Login error:", err)
      switch (err.code) {
        case "auth/invalid-email":
          setError("Invalid email address")
          break
        case "auth/user-disabled":
          setError("Account disabled")
          break
        case "auth/user-not-found":
        case "auth/wrong-password":
          setError("Invalid email or password")
          break
        default:
          setError("Failed to login. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Admin Panel Logo" className={styles.logo} />
          <h1 className={styles.title}>Admin Panel</h1>
          <p className={styles.subtitle}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.inputGroup}>
            <label htmlFor="email" className={styles.inputLabel}>
              Email Address
            </label>
            <div className={styles.inputContainer}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={styles.inputField}
                autoComplete="username"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password" className={styles.inputLabel}>
              Password
            </label>
            <div className={styles.inputContainer}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={styles.inputField}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.footer}>
          <p>© {new Date().getFullYear()} School Diary. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login
