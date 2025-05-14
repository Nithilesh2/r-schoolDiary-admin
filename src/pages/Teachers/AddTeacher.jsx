import { useState, useEffect } from "react"
import { firestore as db } from "../../firebase/firebaseConfig"
import { collection, getDocs, addDoc } from "firebase/firestore"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/AddSchool.module.css"
import { Eye, EyeOff, Trash, Plus } from "react-feather"
import { logActivity } from "../../utils/logActivity"

const AddTeacher = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)

  const [assignments, setAssignments] = useState([
    { subject: "", class: "", section: "" },
  ])

  useEffect(() => {
    const fetchSchools = async () => {
      const querySnapshot = await getDocs(collection(db, "schools"))
      const schoolList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }))
      setSchools(schoolList)
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name || !email || !phone || !schoolId || !password) {
      alert("Please fill all main fields")
      return
    }

    const isEmptyAssignment = assignments.some(
      (a) => !a.subject || !a.class || !a.section
    )
    if (isEmptyAssignment) {
      alert("Please fill all subject/class/section fields")
      return
    }

    try {
      setLoading(true)
      await addDoc(collection(db, "teachers"), {
        name,
        email,
        phone,
        schoolId,
        password,
        role: "teacher",
        assignments,
      })
      await logActivity(`New teacher '${name}' created`, "Admin")
      alert("Teacher added successfully!")

      setName("")
      setEmail("")
      setPhone("")
      setSchoolId("")
      setPassword("")
      setAssignments([{ subject: "", class: "", section: "" }])
      setLoading(false)
    } catch (error) {
      console.error("Error adding teacher: ", error)
      alert("Error adding teacher")
    } finally {
      setLoading(false)
    }
  }

  const resetClicked = () => {
    setName("")
    setEmail("")
    setPhone("")
    setSchoolId("")
    setPassword("")
    setAssignments([{ subject: "", class: "", section: "" }])
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Add New Teacher</h1>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Teacher Name</label>
                  <input
                    type="text"
                    id="name"
                    placeholder="Enter teacher name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="school">School</label>
                  <select
                    id="school"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
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
                  <label htmlFor="password">Password</label>
                  <div className={styles.passContainer}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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

              <h3 className={styles.assignmentTitle}>
                Assign Subject | Classes | Section
              </h3>
              {assignments.map((assignment, index) => (
                <div key={index} className={styles.assignmentGroup}>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={assignment.subject}
                    onChange={(e) =>
                      handleAssignmentChange(index, "subject", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Class"
                    value={assignment.class}
                    onChange={(e) =>
                      handleAssignmentChange(index, "class", e.target.value)
                    }
                  />
                  <input
                    type="text"
                    placeholder="Section"
                    value={assignment.section}
                    onChange={(e) =>
                      handleAssignmentChange(index, "section", e.target.value)
                    }
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
                  onClick={resetClicked}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {loading ? "Adding Teacher..." : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddTeacher
