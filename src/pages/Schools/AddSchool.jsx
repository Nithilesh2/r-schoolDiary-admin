import { useContext, useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { auth, firestore } from "../../firebase/firebaseConfig"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"
import { AppContext } from "../../context/AppContext"
import { createUserWithEmailAndPassword } from "firebase/auth"

const AddSchool = () => {
  const { isOpen, success, failure } = useContext(AppContext)
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    principal: "",
    email: "",
    phone: "",
    address: "",
    adminEmail: "",
    adminPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => {
      if (name === "shortName") {
        const formattedName = value.toLowerCase().replace(/\s+/g, "-")
        return {
          ...prev,
          [name]: value,
          adminEmail: value ? `${formattedName}-admin@schooldiary.com` : "",
        }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.adminEmail,
        form.adminPassword
      )

      await addDoc(collection(firestore, "schools"), {
        name: form.name,
        shortName: form.shortName,
        principal: form.principal,
        email: form.email,
        phone: form.phone,
        address: form.address,
        adminEmail: form.adminEmail,
        adminUid: userCredential.user.uid,
        admissions: 0,
        type: 'school-admin',
        createdAt: new Date(),
      })

      await logActivity(
        `New school '${form.name}' enrolled with admin ${form.adminEmail}`,
        "Admin"
      )

      success(`"${form.name}" added successfully with admin credentials!`)

      setForm({
        name: "",
        shortName: "",
        principal: "",
        email: "",
        phone: "",
        address: "",
        adminEmail: "",
        adminPassword: "",
      })
    } catch (error) {
      console.error("Error adding school:", error)

      let errorMessage = "Failed to add school."
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Admin email already in use."
          break
        case "auth/invalid-email":
          errorMessage = "Invalid admin email address."
          break
        case "auth/weak-password":
          errorMessage = "Admin password is too weak."
          break
      }

      failure(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetClicked = () => {
    setForm({
      name: "",
      shortName: "",
      principal: "",
      email: "",
      phone: "",
      address: "",
      adminEmail: "",
      adminPassword: "",
    })
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Add New School</h1>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">School Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shortName">Short Name*</label>
                  <input
                    type="text"
                    id="shortName"
                    name="shortName"
                    value={form.shortName}
                    onChange={handleChange}
                    placeholder="Enter short name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="principal">Principal Name*</label>
                  <input
                    type="text"
                    id="principal"
                    name="principal"
                    value={form.principal}
                    onChange={handleChange}
                    placeholder="Enter principal name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Principal Email Address*</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Principal Phone Number*</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    maxLength={10}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="address">School Address*</label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    required
                  ></textarea>
                </div>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <h3 className={styles.sectionHeader}>
                  School Admin Credentials
                </h3>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="adminEmail">Admin Email*</label>
                <input
                  type="email"
                  id="adminEmail"
                  name="adminEmail"
                  value={form.adminEmail}
                  onChange={handleChange}
                  placeholder="schoolname-admin@schooldiary.com"
                  required
                  readOnly={!!form.name}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="adminPassword">Admin Password*</label>
                <div className={styles.passwordInputContainer}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="adminPassword"
                    name="adminPassword"
                    value={form.adminPassword}
                    onChange={handleChange}
                    placeholder="Enter password for admin"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className={styles.passwordHint}>
                  Minimum 8 characters with at least one number and one special
                  character
                </p>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={resetClicked}
                  className={styles.cancelButton}
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Adding School...
                    </>
                  ) : (
                    "Add School"
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddSchool
