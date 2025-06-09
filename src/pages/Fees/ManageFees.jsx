/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useState, useEffect } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  writeBatch,
} from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import styles from "./ManageFees.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"

const ManageFees = () => {
  const { isOpen, adminDetails } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [selectedClass, setSelectedClass] = useState("")
  const [students, setStudents] = useState([])
  const [openConfirm, setOpenConfirm] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])

  const [feeStructure, setFeeStructure] = useState({
    totalAmount: "",
    term1Amount: "",
    term1DueDate: "",
    term2Amount: "",
    term2DueDate: "",
  })

  const classes = Array.from({ length: 10 }, (_, i) => i + 1)

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

  useEffect(() => {
    if (feeStructure.totalAmount) {
      const total = parseFloat(feeStructure.totalAmount)
      if (!isNaN(total)) {
        const term1 = (total / 2).toFixed(2)
        const term2 = (total - parseFloat(term1)).toFixed(2)
        setFeeStructure((prev) => ({
          ...prev,
          term1Amount: term1,
          term2Amount: term2,
        }))
      }
    }
  }, [feeStructure.totalAmount])

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(students.map((student) => student.id))
    } else {
      setSelectedStudents([])
    }
    setSelectAll(e.target.checked)
  }

  const handleFeeChange = (e) => {
    const { name, value } = e.target
    setFeeStructure((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmitFees = async () => {
    if (
      !feeStructure.totalAmount ||
      !feeStructure.term1DueDate ||
      !feeStructure.term2DueDate
    ) {
      setError("Please fill all fee details and due dates")
      return
    }

    if (selectedStudents.length === 0) {
      setError("Please select at least one student")
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const batch = writeBatch(firestore)

      selectedStudents.forEach((studentId) => {
        const studentRef = doc(firestore, "students", studentId)
        const classKey = `classId${selectedClass}`

        const feeUpdate = {
          [`feeHistory.${classKey}`]: {
            term1: {
              amount: parseFloat(feeStructure.term1Amount),
              paidAmount: 0,
              status: "pending",
              dueDate: feeStructure.term1DueDate,
            },
            term2: {
              amount: parseFloat(feeStructure.term2Amount),
              paidAmount: 0,
              status: "pending",
              dueDate: feeStructure.term2DueDate,
            },
            totalFee: parseFloat(feeStructure.totalAmount),
            updatedAt: new Date(),
            classId: selectedClass.toString(),
          },
          lastFeeUpdate: new Date(),
        }

        batch.update(studentRef, feeUpdate)
      })

      await batch.commit()

      setSuccess(
        `Fee structure updated for ${selectedStudents.length} students`
      )
      setOpenConfirm(false)
      loadStudents()
      setFeeStructure({
        totalAmount: "",
        term1Amount: "",
        term1DueDate: "",
        term2Amount: "",
        term2DueDate: "",
      })
    } catch (err) {
      console.error("Error updating fees:", err)
      setError("Failed to update fees. Please try again.")
    } finally {
      setLoading(false)
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
          <div className={styles.header}>
            <h1>Manage Student Fees</h1>
            <p className={styles.subHeader}>
              Set fee structure for class students
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Class Fee Structure</h2>
              <div className={styles.formGroup}>
                <label htmlFor="class-select">Select Class</label>
                <select
                  id="class-select"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map((classNum) => (
                    <option key={classNum} value={classNum}>
                      Class {classNum}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className={styles.alertError}>{error}</div>}
            {success && <div className={styles.alertSuccess}>{success}</div>}

            {selectedClass && (
              <>
                <div className={styles.feeForm}>
                  <h3>Fee Details</h3>

                  <div className={styles.feeInputs}>
                    <div className={styles.formGroup}>
                      <label htmlFor="totalAmount">Total Annual Fee (₹)</label>
                      <input
                        type="number"
                        id="totalAmount"
                        name="totalAmount"
                        value={feeStructure.totalAmount}
                        onChange={handleFeeChange}
                        className={styles.inputBar}
                      />
                    </div>

                    <div className={styles.termContainer}>
                      <div className={styles.termBox}>
                        <h4>Term 1</h4>
                        <div className={styles.formGroup}>
                          <label htmlFor="term1Amount">Amount (₹)</label>
                          <input
                            type="number"
                            id="term1Amount"
                            name="term1Amount"
                            value={feeStructure.term1Amount}
                            onChange={handleFeeChange}
                            className={styles.inputBar}
                            disabled
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="term1DueDate">Due Date</label>
                          <input
                            type="date"
                            id="term1DueDate"
                            name="term1DueDate"
                            value={feeStructure.term1DueDate}
                            onChange={(e) =>
                              handleFeeChange({
                                target: {
                                  name: "term1DueDate",
                                  value: e.target.value,
                                },
                              })
                            }
                            className={styles.inputBar}
                          />
                        </div>
                      </div>

                      <div className={styles.termBox}>
                        <h4>Term 2</h4>
                        <div className={styles.formGroup}>
                          <label htmlFor="term2Amount">Amount (₹)</label>
                          <input
                            type="number"
                            id="term2Amount"
                            name="term2Amount"
                            value={feeStructure.term2Amount}
                            onChange={handleFeeChange}
                            className={styles.inputBar}
                            disabled
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label htmlFor="term2DueDate">Due Date</label>
                          <input
                            type="date"
                            id="term2DueDate"
                            name="term2DueDate"
                            value={feeStructure.term2DueDate}
                            onChange={(e) =>
                              handleFeeChange({
                                target: {
                                  name: "term2DueDate",
                                  value: e.target.value,
                                },
                              })
                            }
                            className={styles.inputBar}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.studentSelection}>
                  <div className={styles.selectionHeader}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        indeterminate={
                          selectedStudents.length > 0 &&
                          selectedStudents.length < students.length
                        }
                      />
                      Select Students ({selectedStudents.length}/
                      {students.length})
                    </label>
                  </div>

                  <div className={styles.studentList}>
                    {students.length === 0 ? (
                      <p>No students found in this class</p>
                    ) : (
                      students.map((student) => (
                        <div key={student.id} className={styles.studentItem}>
                          <label>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleStudentSelect(student.id)}
                            />
                            {student.studentName} (
                            {student.admissionNumber || "N/A"})
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button
                    onClick={() => setOpenConfirm(true)}
                    disabled={
                      loading ||
                      selectedStudents.length === 0 ||
                      !feeStructure.totalAmount ||
                      !feeStructure.term1DueDate ||
                      !feeStructure.term2DueDate
                    }
                  >
                    Update Fees
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {openConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3>Confirm Fee Update</h3>
            </div>
            <div className={styles.modalContent}>
              <p>
                You are about to update fees for {selectedStudents.length}{" "}
                students:
              </p>
              <div className={styles.feeSummary}>
                <h4>Fee Structure:</h4>
                <p>Total Annual Fee: ₹{feeStructure.totalAmount}</p>
                <p>
                  Term 1: ₹{feeStructure.term1Amount} (Due:{" "}
                  {new Date(feeStructure.term1DueDate).toLocaleDateString()})
                </p>
                <p>
                  Term 2: ₹{feeStructure.term2Amount} (Due:{" "}
                  {new Date(feeStructure.term2DueDate).toLocaleDateString()})
                </p>
              </div>
              <p className={styles.warningText}>
                This action cannot be undone. Please confirm to proceed.
              </p>
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setOpenConfirm(false)}>Cancel</button>
              <button
                onClick={handleSubmitFees}
                className={styles.confirmButton}
              >
                {loading ? "Processing..." : "Confirm Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManageFees
