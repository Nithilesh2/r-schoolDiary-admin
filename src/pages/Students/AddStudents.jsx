/* eslint-disable react-hooks/exhaustive-deps */
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
  setDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"
import { AppContext } from "../../context/AppContext"
import { Eye, EyeOff } from "lucide-react"

const AddStudent = () => {
  const { isOpen, success, failure, adminDetails, formatIndianNumber } =
    useContext(AppContext)
  const [name, setName] = useState("")
  const [studentClass, setStudentClass] = useState("")
  const [address, setAddress] = useState("")
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState([])
  const [totalFee, setTotalFee] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [loading, setLoading] = useState(false)
  const [admissionNumber, setAdmissionNumber] = useState("")
  const [tempPassword, setTempPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [useCustomAdmission, setUseCustomAdmission] = useState(false)
  const [customAdmissionNumber, setCustomAdmissionNumber] = useState("")

  const [dob, setDob] = useState("")
  const [bloodGroup, setBloodGroup] = useState("")
  const [father, setFather] = useState({
    name: "",
    phone: "",
    email: "",
    occupation: "",
  })
  const [mother, setMother] = useState({
    name: "",
    phone: "",
    email: "",
    occupation: "",
  })

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        if (adminDetails.adminType !== "school-admin") {
          const querySnapshot = await getDocs(collection(db, "schools"))
          const schoolList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            shortName:
              doc.data().shortName || generateShortName(doc.data().name),
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
              shortName: data.shortName || generateShortName(data.name),
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
  }, [adminDetails])

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
        if (!useCustomAdmission) {
          setAdmissionNumber(nextAdmissionNumber.toString())
          setTempPassword(
            `${nextAdmissionNumber}${selectedSchool.shortName}@123`
          )
        }
      }
    }
  }, [schoolId, schools, useCustomAdmission])

  const handleFatherChange = (e) => {
    const { name, value } = e.target
    setFather((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMotherChange = (e) => {
    const { name, value } = e.target
    setMother((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (useCustomAdmission && !customAdmissionNumber) {
      failure("Please enter a custom admission number")
      return
    }
    if (
      !name ||
      !studentClass ||
      !address ||
      !schoolId ||
      !father.name ||
      !father.email ||
      !father.phone
    ) {
      failure("Please fill all required fields")
      return
    }

    try {
      setLoading(true)

      const halfFee = Number(totalFee) / 2
      const schoolRef = doc(db, "schools", schoolId)
      const schoolSnap = await getDoc(schoolRef)

      if (!schoolSnap.exists()) {
        throw new Error("Selected school does not exist")
      }

      const schoolData = schoolSnap.data()
      const schoolShortName =
        schoolData.shortName || generateShortName(schoolData.name)

      const admissionNum = useCustomAdmission
        ? parseInt(customAdmissionNumber)
        : (schoolData.admissions || 0) + 1

      const studentEmail = `${admissionNum}@${schoolShortName}.com`
      const tempPass = `${admissionNum}${schoolShortName}@123`

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        studentEmail,
        tempPass
      )
      const userId = userCredential.user.uid

      const docRef = await addDoc(collection(db, "students"), {
        uid: userId,
        admissionNumber: admissionNum.toString(),
        classId: studentClass,
        studentName: name,
        studentEmail,
        address,
        schoolId,
        schoolName: schoolData.name,
        sectionId,
        role: "student",
        tempPassword,
        createdAt: new Date(),
        dob,
        bloodGroup,
        parents: {
          father,
          mother,
        },
        fees: {
          totalFee: totalFee,
          term1: {
            amount: halfFee,
            paidAmount: 0,
            status: "pending",
          },
          term2: {
            amount: halfFee,
            paidAmount: 0,
            status: "pending",
          },
        },
      })

      await updateDoc(schoolRef, {
        admissions: admissionNum,
        students: arrayUnion({
          id: docRef.id,
          name,
          admissionNumber: admissionNum.toString(),
        }),
      })

      const now = new Date()
      const year =
        now.getMonth() >= 4
          ? `${now.getFullYear()}_${now.getFullYear() + 1}`
          : `${now.getFullYear() - 1}_${now.getFullYear()}`
      const reportRef = doc(db, "academicYearReports", schoolId)

      await setDoc(
        reportRef,
        {
          [year]: {
            schoolId: schoolId,
            totalStudents: increment(1),
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      )

      setSchools((prevSchools) =>
        prevSchools.map((school) =>
          school.id === schoolId
            ? { ...school, admissions: admissionNum }
            : school
        )
      )

      await logActivity(
        `Successfully added ${name} (Adm No: ${admissionNum}) to ${schoolData.name}`,
        adminDetails.adminType !== "school-admin" ? "Admin" : "School Admin"
      )

      success(`Student added successfully! Login email: ${studentEmail}`)

      await fetch(
        "https://push-notifications-backend-ashen.vercel.app/api/sendSMS",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toEmail: father.email,
            username: admissionNum.toString(),
            password: tempPass,
            studentName: name,
            fatherName: father.name,
          }),
        }
      )

      setName("")
      setStudentClass("")
      setAddress("")
      setSchoolId("")
      setSectionId("")
      setTempPassword("")
      setAdmissionNumber("")
      setDob("")
      setBloodGroup("")
      setFather({
        name: "",
        phone: "",
        email: "",
        occupation: "",
      })
      setMother({
        name: "",
        phone: "",
        email: "",
        occupation: "",
      })
      setLoading(false)
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
    setAddress("")
    setSchoolId("")
    setSectionId("")
    setDob("")
    setBloodGroup("")
    setFather({
      name: "",
      phone: "",
      email: "",
      occupation: "",
    })
    setMother({
      name: "",
      phone: "",
      email: "",
      occupation: "",
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
                  <label htmlFor="dob">Date of Birth*</label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="bloodGroup">Blood Group*</label>
                  <select
                    id="bloodGroup"
                    name="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="None">Dont Know</option>
                  </select>
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
                    type="number"
                    id="class"
                    name="class"
                    placeholder="Enter class"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    required
                    max={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="section">Section*</label>
                  <input
                    type="text"
                    id="section"
                    name="section"
                    placeholder="Enter section"
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value.toUpperCase())}
                    required
                    maxLength={1}
                  />
                </div>

                <div className={styles.autoGeneratedValues}>
                  <div className={styles.toggleContainer}>
                    <label htmlFor="customAdmissionToggle">
                      Use Custom Admission Number
                    </label>
                    <input
                      type="checkbox"
                      id="customAdmissionToggle"
                      checked={useCustomAdmission}
                      onChange={(e) => {
                        setUseCustomAdmission(e.target.checked)
                        if (!e.target.checked) {
                          const selectedSchool = schools.find(
                            (school) => school.id === schoolId
                          )
                          if (selectedSchool) {
                            const nextAdmissionNumber =
                              (selectedSchool.admissions || 0) + 1
                            setAdmissionNumber(nextAdmissionNumber.toString())
                            setTempPassword(
                              `${nextAdmissionNumber}${selectedSchool.shortName}@123`
                            )
                          }
                        }
                      }}
                    />
                  </div>

                  {useCustomAdmission ? (
                    <div
                      className={styles.formGroup}
                      style={{ marginTop: "20px" }}
                    >
                      <label htmlFor="customAdmission">
                        Custom Admission Number*
                      </label>
                      <input
                        type="number"
                        id="customAdmission"
                        name="customAdmission"
                        value={customAdmissionNumber}
                        min={0}
                        onChange={(e) => {
                          setCustomAdmissionNumber(e.target.value)
                          setAdmissionNumber(e.target.value)
                          const selectedSchool = schools.find(
                            (school) => school.id === schoolId
                          )
                          if (selectedSchool) {
                            setTempPassword(
                              `${e.target.value}${selectedSchool.shortName}@123`
                            )
                          }
                        }}
                        required
                      />
                    </div>
                  ) : (
                    <div
                      className={styles.formGroup}
                      style={{ marginTop: "20px" }}
                    >
                      <label htmlFor="admission">
                        Admission Number (Auto-generated)
                      </label>
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
                  )}

                  <div className={styles.formGroup}>
                    <label>Student Email (Auto-generated)</label>
                    <input
                      type="text"
                      value={
                        schoolId && admissionNumber
                          ? `${admissionNumber}@${
                              schools.find((s) => s.id === schoolId)?.shortName
                            }.com`
                          : `****@${
                              schools.find((s) => s.id === schoolId)?.shortName
                            }.com`
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
                </div>

                <div className={styles.sectionDivider}>
                  <span>Fee Details</span>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="totalFee">Total Fee (for both terms)*</label>
                  <input
                    type="text"
                    id="totalFee"
                    placeholder="Enter total fee"
                    value={formatIndianNumber(totalFee)}
                    onChange={(e) => {
                      const onlyNums = e.target.value.replace(/[^0-9]/g, "")
                      setTotalFee(onlyNums)
                    }}
                    required
                  />
                </div>

                <div className={styles.sectionDivider}>
                  <span>Father's Information</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fatherName">Father's Name*</label>
                  <input
                    type="text"
                    id="fatherName"
                    name="name"
                    placeholder="Enter father's name"
                    value={father.name}
                    onChange={handleFatherChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fatherPhone">Father's Phone*</label>
                  <input
                    type="tel"
                    id="fatherPhone"
                    name="phone"
                    placeholder="Enter father's phone number"
                    value={father.phone}
                    onChange={handleFatherChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fatherEmail">Father's Email*</label>
                  <input
                    type="email"
                    id="fatherEmail"
                    name="email"
                    placeholder="Enter father's email"
                    value={father.email}
                    onChange={handleFatherChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="fatherOccupation">Father's Occupation*</label>
                  <input
                    type="text"
                    id="fatherOccupation"
                    name="occupation"
                    placeholder="Enter father's occupation"
                    value={father.occupation}
                    onChange={handleFatherChange}
                    required
                  />
                </div>

                <div className={styles.sectionDivider}>
                  <span>Mother's Information</span>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="motherName">Mother's Name*</label>
                  <input
                    type="text"
                    id="motherName"
                    name="name"
                    placeholder="Enter mother's name"
                    value={mother.name}
                    onChange={handleMotherChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="motherPhone">Mother's Phone*</label>
                  <input
                    type="tel"
                    id="motherPhone"
                    name="phone"
                    placeholder="Enter mother's phone number"
                    value={mother.phone}
                    onChange={handleMotherChange}
                    maxLength={10}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="motherEmail">Mother's Email*</label>
                  <input
                    type="email"
                    id="motherEmail"
                    name="email"
                    placeholder="Enter mother's email"
                    value={mother.email}
                    onChange={handleMotherChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="motherOccupation">Mother's Occupation*</label>
                  <input
                    type="text"
                    id="motherOccupation"
                    name="occupation"
                    placeholder="Enter mother's occupation"
                    value={mother.occupation}
                    onChange={handleMotherChange}
                    required
                  />
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
