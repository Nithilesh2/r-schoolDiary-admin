import { useState, useEffect } from "react"
import { firestore as db } from "../../firebase/firebaseConfig"
import { collection, getDocs, addDoc } from "firebase/firestore"
import Sidebar from "../../components/Sidebar"
import styles from "../schools/styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"

const AddStudent = () => {
  const [name, setName] = useState("")
  const [roll, setRoll] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState([])
  const [sectionId, setSectionId] = useState("")
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !name ||
      !roll ||
      !studentClass ||
      !email ||
      !phone ||
      !address ||
      !schoolId
    ) {
      alert("Please fill all fields")
      return
    }

    try {
      setLoading(true)
      await addDoc(collection(db, "students"), {
        admissionNumber: roll,
        classId: studentClass,
        studentName: name,
        email,
        phone,
        address,
        schoolId,
        sectionId,
        role: "student",
      })
      await logActivity(`New student '${name}' enrolled`, "Admin")
      alert("Student added successfully!")

      setName("")
      setRoll("")
      setStudentClass("")
      setEmail("")
      setPhone("")
      setAddress("")
      setSchoolId("")
      setLoading(false)
    } catch (error) {
      console.error("Error adding student: ", error)
      alert("Error adding student")
    } finally {
      setLoading(false)
    }
  }

  const resetClicked = () => {
    setName("")
    setRoll("")
    setStudentClass("")
    setEmail("")
    setPhone("")
    setAddress("")
    setSchoolId("")
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Add New Student</h1>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="school">School</label>
                  <select
                    id="school"
                    name="school"
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
                  <label htmlFor="class">Class</label>
                  <input
                    type="text"
                    id="class"
                    name="class"
                    placeholder="Enter class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="section">Section</label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    placeholder="Enter section ID"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="roll">Roll/Admission Number</label>
                  <input
                    type="text"
                    id="roll"
                    name="roll"
                    placeholder="Enter roll number"
                    value={roll}
                    onChange={(e) => setRoll(e.target.value)}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    placeholder="Enter full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  ></textarea>
                </div>
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
                  {loading ? "Adding Student..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddStudent
