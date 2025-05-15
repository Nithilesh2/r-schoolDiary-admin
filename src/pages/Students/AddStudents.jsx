import { useState, useEffect, useContext } from "react"
import { firestore as db, auth } from "../../firebase/firebaseConfig"
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"
import { AppContext } from "../../context/AppContext"
import { Eye, EyeOff } from "lucide-react"

const AddStudent = () => {
  const { isOpen, success, failure } = useContext(AppContext)
  const [name, setName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState([])
  const [sectionId, setSectionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const fetchSchools = async () => {
      const querySnapshot = await getDocs(collection(db, "schools"))
      const schoolList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        shortName: doc.data().shortName || generateShortName(doc.data().name),
        admissions: doc.data().admissions || 0,
      }))
      setSchools(schoolList)
    }

    fetchSchools()
  }, [])

  const generateShortName = (schoolName) => {
    return schoolName
      .split(" ")
      .map((word) => word[0]?.toLowerCase() || "")
      .join("")
      .substring(0, 5)
  }

  useEffect(() => {
    if (schoolId) {
      const selectedSchool = schools.find((school) => school.id === schoolId)
      if (selectedSchool) {
        const nextAdmissionNumber = (selectedSchool.admissions || 0) + 1
        setAdmissionNumber(nextAdmissionNumber.toString())
        setTempPassword(`${nextAdmissionNumber}${selectedSchool.shortName}@123`)
      }
    }
  }, [schoolId, schools])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !name ||
      !studentClass ||
      !parentEmail ||
      !phone ||
      !address ||
      !schoolId
    ) {
      alert("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      const schoolRef = doc(db, "schools", schoolId)
      const schoolSnap = await getDoc(schoolRef)

      if (!schoolSnap.exists()) {
        throw new Error("Selected school does not exist")
      }

      const schoolData = schoolSnap.data()
      const schoolShortName =
        schoolData.shortName || generateShortName(schoolData.name)
      const nextAdmissionNumber = (schoolData.admissions || 0) + 1

      const studentEmail = `${nextAdmissionNumber}@${schoolShortName}.com`

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        studentEmail,
        tempPassword
      )
      const userId = userCredential.user.uid

      const docRef = await addDoc(collection(db, "students"), {
        uid: userId,
        admissionNumber: nextAdmissionNumber.toString(),
        classId: studentClass,
        studentName: name,
        studentEmail,
        parentEmail,
        phone,
        address,
        schoolId,
        schoolName: schoolData.name,
        sectionId,
        role: "student",
        tempPassword,
        createdAt: new Date(),
      })

      await updateDoc(schoolRef, {
        admissions: nextAdmissionNumber,
        students: arrayUnion({
          id: docRef.id,
          name,
          admissionNumber: nextAdmissionNumber.toString(),
        }),
      })

      setSchools((prevSchools) =>
        prevSchools.map((school) =>
          school.id === schoolId
            ? { ...school, admissions: nextAdmissionNumber }
            : school
        )
      )

      await logActivity(
        `Successfully added ${name} (Adm No: ${nextAdmissionNumber}) to ${schoolData.name}`,
        "Admin"
      )

      success(`Student added successfully! Login email: ${studentEmail}`)

      setName("")
      setStudentClass("")
      setParentEmail("")
      setPhone("")
      setAddress("")
      setSchoolId("")
      setSectionId("")
      setTempPassword("")
      setAdmissionNumber("")
    } catch (error) {
      console.error("Error adding student: ", error)
      let errorMessage = "Error adding student"

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Student email already exists"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters"
      }

      failure(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const resetClicked = () => {
    setName("")
    setStudentClass("")
    setParentEmail("")
    setPhone("")
    setAddress("")
    setSchoolId("")
    setSectionId("")
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
            <h1>Add New Student</h1>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name*</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="parentEmail">Parent's Email Address*</label>
                  <input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    placeholder="Enter parent's email address"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Parent's Phone Number*</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter parent's phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="school">School*</label>
                  <select
                    id="school"
                    name="school"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                  >
                    <option value="">Select School</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="class">Class*</label>
                  <input
                    type="text"
                    id="class"
                    name="class"
                    placeholder="Enter class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="section">Section*</label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    placeholder="Enter section ID"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="admission">Admission Number</label>
                  <input
                    type="text"
                    id="admission"
                    name="admission"
                    value={admissionNumber}
                    readOnly
                    className={styles.readOnlyInput}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Student Email (Auto-generated)</label>
                  <input
                    type="text"
                    value={
                      schoolId && admissionNumber
                        ? `${admissionNumber}@${
                            schools.find((s) => s.id === schoolId)?.shortName
                          }.com`
                        : "Select school first"
                    }
                    readOnly
                    className={styles.readOnlyInput}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Temporary Password</label>
                  <div className={styles.passContainer}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={tempPassword}
                      readOnly
                      className={styles.readOnlyInput}
                      style={{ cursor: "not-allowed" }}
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

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="address">Address*</label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    placeholder="Enter full address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
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
