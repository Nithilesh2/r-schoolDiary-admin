/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useContext } from "react"
import { firestore as db, auth } from "../../firebase/firebaseConfig"
import { collection, getDocs, addDoc, doc, getDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/AddSchool.module.css"
import { Eye, EyeOff, Trash, Plus } from "react-feather"
import { logActivity } from "../../utils/logActivity"
import { AppContext } from "../../context/AppContext"

const AddTeacher = () => {
  const { isOpen, success, failure, adminDetails } = useContext(AppContext)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [assignments, setAssignments] = useState([
    { subject: "", class: "", section: "" },
  ])

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        if (adminDetails.adminType !== "school-admin") {
          const querySnapshot = await getDocs(collection(db, "schools"))
          const schoolList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            shortName: doc.data().shortName,
            admissions: doc.data().admissions || 0,
          }))
          setSchools(schoolList)
        } else {
          const schoolRef = doc(db, "schools", adminDetails.schoolId)
          const schoolSnap = await getDoc(schoolRef)

          if (schoolSnap.exists()) {
            const data = schoolSnap.data()
            const school = {
              id: schoolSnap.id,
              name: data.name,
              shortName: data.shortName,
              admissions: data.admissions || 0,
            }
            setSchools([school])
            setSchoolId(school.id)
          } else {
            failure("School not found for the current admin")
          }
        }
      } catch (error) {
        console.log(error)
      }
    }

    fetchSchools()
  }, [])

  const handleAssignmentChange = (index, field, value) => {
    const updatedAssignments = [...assignments]
    updatedAssignments[index][field] = value
    setAssignments(updatedAssignments)
  }

  const addAssignment = () => {
    setAssignments([...assignments, { subject: "", class: "", section: "" }])
  }

  const removeAssignment = (index) => {
    const updated = assignments.filter((_, i) => i !== index)
    setAssignments(updated)
  }

  const handleBasicInfoSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !phone || !schoolId || !password) {
      alert("Please fill all required fields")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address")
      return
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }
    setStep(2)
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault()

    const isEmptyAssignment = assignments.some(
      (a) => !a.subject || !a.class || !a.section
    )
    if (isEmptyAssignment) {
      alert("Please fill all subject/class/section fields")
      return
    }

    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      )
      const userId = userCredential.user.uid

      await addDoc(collection(db, "teachers"), {
        uid: userId,
        name,
        email,
        phone,
        schoolId,
        role: "teacher",
        assignments,
        createdAt: new Date(),
      })

      const selectedSchool = schools.find((s) => s.id === schoolId)
      await logActivity(
        `Successfully added teacher ${name} to ${selectedSchool?.name}`,
        adminDetails.adminType !== "school-admin" ? "Admin" : "School"
      )

      success("Teacher added successfully!")
      resetForm()
    } catch (error) {
      console.error("Error adding teacher: ", error)
      let errorMessage = "Error adding teacher"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email already in use"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      }

      failure(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setEmail("")
    setPhone("")
    setSchoolId("")
    setPassword("")
    setAssignments([{ subject: "", class: "", section: "" }])
    setStep(1)
  }

  const goBack = () => {
    setStep(1)
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
            <h1>Add New Teacher</h1>
          </div>

          <div className={styles.formCard}>
            {step === 1 ? (
              <form onSubmit={handleBasicInfoSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name">Teacher Name*</label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Enter teacher name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address*</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone">Phone Number*</label>
                    <input
                      type="tel"
                      id="phone"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="school">School*</label>
                    <select
                      id="school"
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      required
                    >
                      <option value="">Select School</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="password">Password*</label>
                    <div className={styles.passContainer}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        placeholder="Enter password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      {showPassword ? (
                        <EyeOff
                          size={16}
                          className={styles.eye}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      ) : (
                        <Eye
                          size={16}
                          className={styles.eye}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submitButton}>
                    Next: Assign Subjects
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleFinalSubmit}>
                <h3 className={styles.assignmentTitle}>
                  Assign Subject | Classes | Section
                </h3>
                {assignments.map((assignment, index) => (
                  <div key={index} className={styles.assignmentGroup}>
                    <input
                      type="text"
                      placeholder="Subject*"
                      value={assignment.subject}
                      onChange={(e) =>
                        handleAssignmentChange(index, "subject", e.target.value)
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Class*"
                      value={assignment.class}
                      onChange={(e) =>
                        handleAssignmentChange(index, "class", e.target.value)
                      }
                      required
                    />
                    <input
                      type="text"
                      placeholder="Section*"
                      value={assignment.section}
                      onChange={(e) =>
                        handleAssignmentChange(index, "section", e.target.value)
                      }
                      required
                    />
                    {assignments.length > 1 && (
                      <div
                        className={styles.trashContainer}
                        onClick={() => removeAssignment(index)}
                      >
                        <Trash size={16} color="white" />
                      </div>
                    )}
                  </div>
                ))}
                <div className={styles.AddContainer}>
                  <Plus size={16} color="white" onClick={addAssignment} />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    onClick={goBack}
                    className={styles.cancelButton}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? "Adding Teacher..." : "Complete Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddTeacher
