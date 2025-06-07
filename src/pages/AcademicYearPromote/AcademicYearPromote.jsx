/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import styles from "./AcademicYearPromote.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import MenuItem from "@mui/material/MenuItem"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"

const AcademicYearPromote = () => {
  const { isOpen, adminDetails } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [openBulkConfirm, setOpenBulkConfirm] = useState(false)
  const [openSingleConfirm, setOpenSingleConfirm] = useState(false)
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectAll, setSelectAll] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [studentToPromote, setStudentToPromote] = useState(null)

  const classes = [...Array.from({ length: 10 }, (_, i) => i + 1)]

  const loadStudents = async () => {
    if (!selectedClass) return

    try {
      setLoading(true)
      setError("")
      setStudents([])
      setSelectedStudents([])
      setSelectAll(false)

      let studentsQuery
      if (adminDetails.adminType !== "school-admin") {
        studentsQuery = query(
          collection(firestore, "students"),
          where("classId", "==", selectedClass.toString())
        )
      } else {
        studentsQuery = query(
          collection(firestore, "students"),
          where("schoolId", "==", adminDetails.schoolId),
          where("classId", "==", selectedClass.toString())
        )
      }

      const studentsSnapshot = await getDocs(studentsQuery)
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      console.log(studentsData)
      setStudents(studentsData)
    } catch (err) {
      console.error("Error loading students:", err)
      setError("Failed to load students. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedClass) {
      loadStudents()
    }
  }, [selectedClass])

  const handlePromoteStudents = async () => {
    try {
      setOpenBulkConfirm(false)
      setLoading(true)
      setError("")
      setSuccess("")

      await Promise.all(
        selectedStudents.map(async (studentId) => {
          const student = students.find((s) => s.id === studentId)
          if (student) {
            const currentClass = parseInt(student.classId)
            if (!isNaN(currentClass)) {
              const studentRef = doc(firestore, "students", studentId)
              await updateDoc(studentRef, {
                classId:
                  currentClass === 10
                    ? "Graduate"
                    : (currentClass + 1).toString(),
                promotedOn: new Date(),
              })
            }
          }
        })
      )

      setSuccess(
        `${selectedStudents.length} students have been promoted successfully!`
      )
      loadStudents()
    } catch (err) {
      console.error("Promotion error:", err)
      setError("Failed to promote students. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteSingleStudent = async () => {
    if (!studentToPromote) return

    try {
      setOpenSingleConfirm(false)
      setLoading(true)
      setError("")
      setSuccess("")

      const student = students.find((s) => s.id === studentToPromote)
      if (student) {
        const currentClass = parseInt(student.classId)
        if (!isNaN(currentClass)) {
          const studentRef = doc(firestore, "students", studentToPromote)
          await updateDoc(studentRef, {
            classId:
              currentClass === 10 ? "Graduate" : (currentClass + 1).toString(),
            promotedOn: new Date(),
          })
          setSuccess(`Student ${student.studentName} promoted successfully!`)
          loadStudents()
        }
      }
    } catch (err) {
      console.error("Promotion error:", err)
      setError("Failed to promote student. Please try again.")
    } finally {
      setLoading(false)
      setStudentToPromote(null)
    }
  }

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const filteredIds = filteredStudents.map((student) => student.id)
      setSelectedStudents(filteredIds)
    } else {
      setSelectedStudents([])
    }
    setSelectAll(e.target.checked)
  }

  const handleSinglePromoteClick = (studentId) => {
    setStudentToPromote(studentId)
    setOpenSingleConfirm(true)
  }

  const filteredStudents = students
    .filter((student) => student.classId !== "Graduate")
    .filter((student) =>
      student.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
        <main className={styles.content}>
          <div className={styles.header}>
            <h1>Academic Year Promotion</h1>
            <p className={styles.subHeader}>Manage student class promotions</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Promote Students</h2>
              <div className={styles.classSelector}>
                <TextField
                  select
                  label="Select Class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                >
                  <MenuItem value="">
                    <em>Select class</em>
                  </MenuItem>
                  {classes.map((classNum) => (
                    <MenuItem key={classNum} value={classNum}>
                      Class {classNum}
                    </MenuItem>
                  ))}
                </TextField>
              </div>
            </div>

            {error && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}

            {selectedClass && (
              <>
                <div className={styles.toolbar}>
                  <div className={styles.searchBox}>
                    <TextField
                      placeholder="Search students..."
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <span className={styles.searchIcon}>
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path
                                fill="#999"
                                d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
                              />
                            </svg>
                          </span>
                        ),
                      }}
                    />
                  </div>
                  <div className={styles.bulkActions}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectAll}
                          onChange={handleSelectAll}
                          indeterminate={
                            selectedStudents.length > 0 &&
                            selectedStudents.length < filteredStudents.length
                          }
                          style={{ color: "indigo" }}
                        />
                      }
                      label="Select all"
                      className={styles.selectAllLabel}
                    />
                    <Button
                      variant="contained"
                      style={{ backgroundColor: "indigo", color: "white" }}
                      size="small"
                      disabled={
                        loading ||
                        selectedStudents.length === 0 ||
                        selectedClass === "Graduate"
                      }
                      onClick={() => setOpenBulkConfirm(true)}
                      startIcon={
                        <svg width="16" height="16" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                          />
                        </svg>
                      }
                    >
                      Promote Selected ({selectedStudents.length})
                    </Button>
                  </div>
                </div>

                <div className={styles.studentTable}>
                  {filteredStudents.length === 0 ? (
                    <div className={styles.emptyState}>
                      <svg width="48" height="48" viewBox="0 0 24 24">
                        <path
                          fill="#999"
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                        />
                      </svg>
                      <p>No students found</p>
                    </div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th width="50px"></th>
                          <th>Student Name</th>
                          <th>Section</th>
                          <th>Roll/Admission No.</th>
                          <th width="120px">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <Checkbox
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleStudentSelect(student.id)}
                                style={{ color: "indigo" }}
                              />
                            </td>
                            <td>
                              <div className={styles.studentName}>
                                <span className={styles.avatar}>
                                  {student.studentName?.charAt(0) || "S"}
                                </span>
                                {student.studentName}
                              </div>
                            </td>
                            <td>{student.sectionId || "N/A"}</td>
                            <td>{student.admissionNumber || "N/A"}</td>
                            <td>
                              <Button
                                style={{
                                  backgroundColor: "indigo",
                                  color: "white",
                                }}
                                size="small"
                                onClick={() =>
                                  handleSinglePromoteClick(student.id)
                                }
                                disabled={loading || selectedClass === "Graduate"}
                                startIcon={
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      fill="currentColor"
                                      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                                    />
                                  </svg>
                                }
                              >
                                Promote
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            <div className={styles.footerNote}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#666"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                />
              </svg>
              <p>
                <strong>Note:</strong> Students can only be promoted from
                classes 1 to 9. Class 10 students will graduate instead of being
                promoted.
              </p>
            </div>
          </div>
        </main>
      </div>

      <Dialog
        open={openBulkConfirm}
        onClose={() => setOpenBulkConfirm(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className={styles.dialogTitle}>
          Confirm Bulk Promotion
        </DialogTitle>
        <DialogContent>
          <div className={styles.dialogContent}>
            <div className={styles.dialogIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24">
                <path
                  fill="#4B0082"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v8h-2V5z"
                />
              </svg>
            </div>
            <div className={styles.dialogText}>
              <h3>
                Are you sure you want to promote {selectedStudents.length}{" "}
                students?
              </h3>
              <p>
                This will move all selected students from{" "}
                <strong>Class {selectedClass}</strong> to{" "}
                <strong>
                  {parseInt(selectedClass) === 10
                    ? "Graduate"
                    : `Class ${parseInt(selectedClass) + 1}`}
                </strong>
                .
              </p>
              <p className={styles.warningText}>
                <strong>Warning:</strong> This action cannot be undone. Please
                verify your selection before proceeding.
              </p>
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button
            onClick={() => setOpenBulkConfirm(false)}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromoteStudents}
            className={styles.confirmButton}
            variant="contained"
          >
            Yes, Promote Students
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openSingleConfirm}
        onClose={() => setOpenSingleConfirm(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle className={styles.dialogTitle}>
          Confirm Student Promotion
        </DialogTitle>
        <DialogContent>
          <div className={styles.dialogContent}>
            <div className={styles.dialogIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24">
                <path
                  fill="#4B0082"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v8h-2V5z"
                />
              </svg>
            </div>
            <div className={styles.dialogText}>
              <h3>Are you sure you want to promote this student?</h3>
              {studentToPromote && (
                <>
                  <p>
                    Student:{" "}
                    <strong>
                      {
                        students.find((s) => s.id === studentToPromote)
                          ?.studentName
                      }
                    </strong>
                  </p>
                  <p>
                    Current Class: <strong>{selectedClass}</strong> → New Class:{" "}
                    <strong>
                      {parseInt(selectedClass) === 10
                        ? "Graduate"
                        : parseInt(selectedClass) + 1}
                    </strong>
                  </p>
                  <p className={styles.warningText}>
                    <strong>Note:</strong> This action cannot be undone.
                  </p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions className={styles.dialogActions}>
          <Button
            onClick={() => setOpenSingleConfirm(false)}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromoteSingleStudent}
            className={styles.confirmButton}
            variant="contained"
          >
            Yes, Promote Student
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default AcademicYearPromote
