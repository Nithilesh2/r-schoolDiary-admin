/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useContext } from "react"
import { firestore as db, auth } from "../../firebase/firebaseConfig"
import {
  collection,
  getDocs,
  doc,
  arrayUnion,
  getDoc,
  setDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"
import { AppContext } from "../../context/AppContext"
import Papa from "papaparse"
import { Upload, FileText, Trash } from "lucide-react"

const BulkImportStudents = () => {
  const { isOpen, success, failure, adminDetails, formatIndianNumber } =
    useContext(AppContext)
  const [schoolId, setSchoolId] = useState("")
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [startAdmissionNumber, setStartAdmissionNumber] = useState("")
  const [useCustomAdmission, setUseCustomAdmission] = useState(false)

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
            setStartAdmissionNumber((data.admissions || 0) + 1)
          } else {
            failure("School not found for the current admin")
          }
        }
      } catch (error) {
        console.log(error)
        failure("Failed to fetch schools")
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
    if (schoolId && !useCustomAdmission) {
      const selectedSchool = schools.find((school) => school.id === schoolId)
      if (selectedSchool) {
        setStartAdmissionNumber((selectedSchool.admissions || 0) + 1)
      }
    }
  }, [schoolId, schools, useCustomAdmission])

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return

    if (!uploadedFile.name.endsWith(".csv")) {
      failure("Please upload a CSV file")
      return
    }

    setFile(uploadedFile)
    setParsedData([])
    setValidationErrors([])
    setUploadProgress(0)
    setTotalStudents(0)
    setSuccessCount(0)
    setErrorCount(0)

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          failure("CSV file is empty")
          return
        }

        const requiredColumns = [
          "studentName",
          "class",
          "section",
          "dob",
          "bloodGroup",
          "admissionNumber",
          "fatherName",
          "fatherPhone",
          "fatherEmail",
          "fatherOccupation",
          "motherName",
          "motherPhone",
          "motherEmail",
          "motherOccupation",
          "address",
          "totalFee",
        ]

        const missingColumns = requiredColumns.filter(
          (col) => !results.meta.fields.includes(col)
        )

        if (missingColumns.length > 0) {
          failure(`Missing required columns: ${missingColumns.join(", ")}`)
          return
        }

        const errors = []
        const validatedData = results.data.map((row, index) => {
          const rowErrors = []

          if (!row.studentName) rowErrors.push("Student name is required")
          if (!row.class) rowErrors.push("Class is required")
          if (!row.section) rowErrors.push("Section is required")
          if (!row.dob) rowErrors.push("Date of birth is required")
          if (!row.bloodGroup) rowErrors.push("Blood group is required")
          if (!row.fatherName) rowErrors.push("Father's name is required")
          if (!row.fatherPhone) rowErrors.push("Father's phone is required")
          if (!row.fatherEmail) rowErrors.push("Father's email is required")
          if (!row.address) rowErrors.push("Address is required")
          if (!row.totalFee) rowErrors.push("Total fee is required")

          if (row.fatherPhone && !/^\d{10}$/.test(row.fatherPhone)) {
            rowErrors.push("Father's phone must be 10 digits")
          }
          if (row.motherPhone && !/^\d{10}$/.test(row.motherPhone)) {
            rowErrors.push("Mother's phone must be 10 digits")
          }
          if (
            row.fatherEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.fatherEmail)
          ) {
            rowErrors.push("Father's email is invalid")
          }
          if (
            row.motherEmail &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.motherEmail)
          ) {
            rowErrors.push("Mother's email is invalid")
          }

          const validBloodGroups = [
            "A+",
            "A-",
            "B+",
            "B-",
            "AB+",
            "AB-",
            "O+",
            "O-",
            "None",
          ]
          if (row.bloodGroup && !validBloodGroups.includes(row.bloodGroup)) {
            rowErrors.push("Invalid blood group")
          }

          if (rowErrors.length > 0) {
            errors.push({
              row: index + 2,
              errors: rowErrors,
            })
          }

          return {
            ...row,
            class: parseInt(row.class) || 0,
            totalFee: row.totalFee.replace(/\D/g, "") || 0,
            section: row.section.toUpperCase(),
            isValid: rowErrors.length === 0,
          }
        })

        setParsedData(validatedData)
        setValidationErrors(errors)
        setTotalStudents(validatedData.length)
      },
      error: (error) => {
        console.error("Error parsing CSV:", error)
        failure("Error parsing CSV file")
      },
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!schoolId) {
      failure("Please select a school")
      return
    }

    if (!file || parsedData.length === 0) {
      failure("Please upload a valid CSV file first")
      return
    }

    if (validationErrors.length > 0) {
      failure("Please fix all validation errors before submitting")
      return
    }

    if (useCustomAdmission && !startAdmissionNumber) {
      failure("Please enter a starting admission number")
      return
    }

    try {
      setLoading(true)
      setSuccessCount(0)
      setErrorCount(0)

      const schoolRef = doc(db, "schools", schoolId)
      const schoolSnap = await getDoc(schoolRef)

      if (!schoolSnap.exists()) {
        throw new Error("Selected school does not exist")
      }

      const schoolData = schoolSnap.data()
      const schoolShortName =
        schoolData.shortName || generateShortName(schoolData.name)

      let currentAdmissionNumber = useCustomAdmission
        ? parseInt(startAdmissionNumber)
        : (schoolData.admissions || 0) + 1

      const batchSize = 10
      const batches = Math.ceil(parsedData.length / batchSize)
      let successfulImports = 0
      let failedImports = 0

      for (let i = 0; i < batches; i++) {
        const batchStart = i * batchSize
        const batchEnd = Math.min((i + 1) * batchSize, parsedData.length)
        const batchData = parsedData.slice(batchStart, batchEnd)

        const firestoreBatch = writeBatch(db)

        for (const student of batchData) {
          try {
            const admissionNum = currentAdmissionNumber
            currentAdmissionNumber++
            const studentEmail = `${admissionNum}@${schoolShortName}.com`
            const tempPass = `${admissionNum}${schoolShortName}@123`

            await createUserWithEmailAndPassword(auth, studentEmail, tempPass)
              .then(async (userCredential) => {
                const userId = userCredential.user.uid

                const studentData = {
                  uid: userId,
                  admissionNumber: admissionNum.toString(),
                  classId: String(student.class),
                  studentName: student.studentName,
                  studentEmail,
                  address: student.address,
                  schoolId,
                  schoolName: schoolData.name,
                  sectionId: student.section,
                  role: "student",
                  tempPassword: tempPass,
                  createdAt: new Date(),
                  dob: student.dob,
                  bloodGroup: student.bloodGroup,
                  parents: {
                    father: {
                      name: student.fatherName,
                      phone: student.fatherPhone,
                      email: student.fatherEmail,
                      occupation: student.fatherOccupation || "",
                    },
                    mother: {
                      name: student.motherName || "",
                      phone: student.motherPhone || "",
                      email: student.motherEmail || "",
                      occupation: student.motherOccupation || "",
                    },
                  },
                }

                const studentRef = doc(collection(db, "students"))
                firestoreBatch.set(studentRef, studentData)

                firestoreBatch.update(schoolRef, {
                  students: arrayUnion({
                    id: studentRef.id,
                    name: student.studentName,
                    admissionNumber: admissionNum.toString(),
                  }),
                })

                await fetch(
                  "https://push-notifications-backend-ashen.vercel.app/api/sendSMS",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      toEmail: student.fatherEmail,
                      username: admissionNum.toString(),
                      password: tempPass,
                      studentName: student.studentName,
                      fatherName: student.fatherName,
                    }),
                  }
                )

                successfulImports++
                setSuccessCount(successfulImports)
              })
              .catch((error) => {
                console.error("Error creating auth user:", error)
                failedImports++
                setErrorCount(failedImports)
              })
          } catch (error) {
            console.error("Error processing student:", error)
            failedImports++
            setErrorCount(failedImports)
          }
        }

        firestoreBatch.update(schoolRef, {
          admissions: currentAdmissionNumber - 1,
        })

        await firestoreBatch.commit()

        setUploadProgress(Math.round((batchEnd / parsedData.length) * 100))
      }

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
            totalStudents: increment(successfulImports),
            updatedAt: serverTimestamp(),
          },
        },
        { merge: true }
      )

      await logActivity(
        `Bulk imported ${successfulImports} students to ${schoolData.name}`,
        adminDetails.adminType !== "school-admin" ? "Admin" : "School Admin"
      )

      success(
        `Bulk import completed! Success: ${successfulImports}, Failed: ${failedImports}`
      )

      setFile(null)
      setParsedData([])
      setValidationErrors([])
      setUploadProgress(0)
    } catch (error) {
      console.error("Error in bulk import:", error)
      failure(`Bulk import failed: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const csvHeaders = [
      "studentName",
      "class",
      "section",
      "dob",
      "admissionNumber",
      "bloodGroup",
      "fatherName",
      "fatherPhone",
      "fatherEmail",
      "fatherOccupation",
      "motherName",
      "motherPhone",
      "motherEmail",
      "motherOccupation",
      "address",
      "totalFee",
    ].join(",")

    const csvContent = `${csvHeaders}`
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "student_import_template.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const [expandedStudent, setExpandedStudent] = useState(null)

  const toggleStudent = (index) => {
    setExpandedStudent(expandedStudent === index ? null : index)
  }

  const convertToDateInputFormat = (dateString) => {
    if (!dateString) return ""

    const parts = dateString.split("/")
    if (parts.length === 3) {
      const month = parts[0].padStart(2, "0")
      const day = parts[1].padStart(2, "0")
      const year = parts[2]
      return `${year}-${month}-${day}`
    }

    return dateString
  }

  const handleDeleteStudent = (index) => {
    const newData = [...parsedData]
    newData.splice(index, 1)
    setParsedData(newData)
    setTotalStudents(newData.length)

    if (validationErrors.length > 0) {
      const newErrors = validationErrors.filter(
        (error) => error.row !== index + 2
      )
      setValidationErrors(newErrors)
    }

    if (expandedStudent === index) {
      setExpandedStudent(null)
    } else if (expandedStudent > index) {
      setExpandedStudent(expandedStudent - 1)
    }
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
            <h1>Bulk Import Students</h1>
            <p>Upload a CSV file to add multiple students at once</p>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="school">School*</label>
                  <select
                    id="school"
                    name="school"
                    value={schoolId}
                    onChange={(e) => setSchoolId(e.target.value)}
                    required
                    disabled={adminDetails.adminType === "school-admin"}
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
                  <label>CSV Template</label>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className={styles.templateButton}
                  >
                    <FileText size={16} /> Download Template
                  </button>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="csvFile">Upload CSV File*</label>
                  <div className={styles.fileUploadContainer}>
                    <label htmlFor="csvFile" className={styles.fileUploadLabel}>
                      <Upload size={20} />
                      <span>{file ? file.name : "Choose a CSV file"}</span>
                      <input
                        type="file"
                        id="csvFile"
                        accept=".csv"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                        required
                      />
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="useCustomAdmission">
                    Use Custom Admission Numbers
                  </label>
                  <input
                    type="checkbox"
                    id="useCustomAdmission"
                    checked={useCustomAdmission}
                    onChange={(e) => {
                      setUseCustomAdmission(e.target.checked)
                      if (!e.target.checked) {
                        const selectedSchool = schools.find(
                          (school) => school.id === schoolId
                        )
                        if (selectedSchool) {
                          setStartAdmissionNumber(
                            (selectedSchool.admissions || 0) + 1
                          )
                        }
                      }
                    }}
                  />
                </div>

                {useCustomAdmission && (
                  <div className={styles.formGroup}>
                    <label htmlFor="startAdmissionNumber">
                      Starting Admission Number*
                    </label>
                    <input
                      type="number"
                      id="startAdmissionNumber"
                      value={startAdmissionNumber}
                      onChange={(e) => setStartAdmissionNumber(e.target.value)}
                      required
                      min={1}
                    />
                  </div>
                )}

                {parsedData.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <h3>Student Records ({parsedData.length})</h3>
                    <div className={styles.studentRecordsContainer}>
                      {parsedData.map((student, index) => (
                        <div key={index} className={styles.studentRecordCard}>
                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() => handleDeleteStudent(index)}
                            title="Delete Student"
                          >
                            <Trash size={18} color="black" weight="bold" />
                          </button>

                          <button
                            type="button"
                            className={styles.dropdownHeader}
                            onClick={() => toggleStudent(index)}
                          >
                            <span>
                              Student #{index + 1}: {student.studentName}
                            </span>
                            <span className={styles.dropdownIcon}>
                              {expandedStudent === index ? "−" : "+"}
                            </span>
                          </button>

                          {expandedStudent === index && (
                            <div
                              className={styles.formGrid}
                              style={{ padding: "10px" }}
                            >
                              <div className={styles.formGroup}>
                                <label>Admission Number*</label>
                                <input
                                  type="text"
                                  value={student.admissionNumber}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].admissionNumber =
                                      e.target.value
                                    setParsedData(newData)
                                  }}
                                  required
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label>Student Name</label>
                                <input
                                  type="text"
                                  value={student.studentName}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].studentName = e.target.value
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                  <label>Class</label>
                                  <input
                                    type="number"
                                    value={student.class}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].class =
                                        parseInt(e.target.value) || 0
                                      setParsedData(newData)
                                    }}
                                  />
                                </div>
                                <div className={styles.formGroup}>
                                  <label>Section</label>
                                  <input
                                    type="text"
                                    value={student.section}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].section =
                                        e.target.value.toUpperCase()
                                      setParsedData(newData)
                                    }}
                                    maxLength={1}
                                  />
                                </div>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Date of Birth</label>
                                <input
                                  type="date"
                                  value={convertToDateInputFormat(student.dob)}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    const dateParts = e.target.value.split("-")
                                    newData[
                                      index
                                    ].dob = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label>Blood Group</label>
                                <select
                                  value={student.bloodGroup}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].bloodGroup = e.target.value
                                    setParsedData(newData)
                                  }}
                                >
                                  <option value="A+">A+</option>
                                  <option value="A-">A-</option>
                                  <option value="B+">B+</option>
                                  <option value="B-">B-</option>
                                  <option value="AB+">AB+</option>
                                  <option value="AB-">AB-</option>
                                  <option value="O+">O+</option>
                                  <option value="O-">O-</option>
                                  <option value="None">Don't Know</option>
                                </select>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Total Fee</label>
                                <input
                                  type="text"
                                  value={formatIndianNumber(student.totalFee)}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    const onlyNums = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    )
                                    newData[index].totalFee = onlyNums || 0
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.formGroup}>
                                <label>Generated Email</label>
                                <div className={styles.readOnlyField}>
                                  {student.admissionNumber}@
                                  {
                                    schools.find((s) => s.id === schoolId)
                                      ?.shortName
                                  }
                                  .com
                                </div>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Generated Password</label>
                                <div className={styles.readOnlyField}>
                                  {student.admissionNumber}
                                  {
                                    schools.find((s) => s.id === schoolId)
                                      ?.shortName
                                  }
                                  @123
                                </div>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Address</label>
                                <textarea
                                  value={student.address}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].address = e.target.value
                                    setParsedData(newData)
                                  }}
                                  rows={2}
                                />
                              </div>

                              <div className={styles.sectionDivider}>
                                <span>Father's Information</span>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Father's Name</label>
                                <input
                                  type="text"
                                  value={student.fatherName}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].fatherName = e.target.value
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                  <label>Father's Phone</label>
                                  <input
                                    type="tel"
                                    value={student.fatherPhone}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].fatherPhone =
                                        e.target.value
                                      setParsedData(newData)
                                    }}
                                    maxLength={10}
                                  />
                                </div>
                                <div className={styles.formGroup}>
                                  <label>Father's Email</label>
                                  <input
                                    type="email"
                                    value={student.fatherEmail}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].fatherEmail =
                                        e.target.value
                                      setParsedData(newData)
                                    }}
                                  />
                                </div>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Father's Occupation</label>
                                <input
                                  type="text"
                                  value={student.fatherOccupation}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].fatherOccupation =
                                      e.target.value
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.sectionDivider}>
                                <span>Mother's Information</span>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Mother's Name</label>
                                <input
                                  type="text"
                                  value={student.motherName}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].motherName = e.target.value
                                    setParsedData(newData)
                                  }}
                                />
                              </div>

                              <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                  <label>Mother's Phone</label>
                                  <input
                                    type="tel"
                                    value={student.motherPhone}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].motherPhone =
                                        e.target.value
                                      setParsedData(newData)
                                    }}
                                    maxLength={10}
                                  />
                                </div>
                                <div className={styles.formGroup}>
                                  <label>Mother's Email</label>
                                  <input
                                    type="email"
                                    value={student.motherEmail}
                                    onChange={(e) => {
                                      const newData = [...parsedData]
                                      newData[index].motherEmail =
                                        e.target.value
                                      setParsedData(newData)
                                    }}
                                  />
                                </div>
                              </div>

                              <div className={styles.formGroup}>
                                <label>Mother's Occupation</label>
                                <input
                                  type="text"
                                  value={student.motherOccupation}
                                  onChange={(e) => {
                                    const newData = [...parsedData]
                                    newData[index].motherOccupation =
                                      e.target.value
                                    setParsedData(newData)
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {validationErrors.length > 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.validationErrors}>
                      <h4>Validation Errors Found:</h4>
                      <p>
                        Please fix {validationErrors.length} error(s) in your
                        CSV file before importing.
                      </p>
                    </div>
                  </div>
                )}

                {parsedData.length > 0 && validationErrors.length === 0 && (
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <div className={styles.uploadStats}>
                      <p>
                        Ready to import {parsedData.length} valid student
                        records.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={
                    loading ||
                    !file ||
                    parsedData.length === 0 ||
                    validationErrors.length > 0
                  }
                >
                  {loading ? (
                    <>
                      {uploadProgress > 0 && `${uploadProgress}% • `}
                      Processing {successCount + errorCount}/{totalStudents}...
                    </>
                  ) : (
                    "Import Students"
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

export default BulkImportStudents
