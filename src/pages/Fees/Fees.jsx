import React, { useState, useContext } from "react"
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore"
import { firestore as db } from "../../firebase/firebaseConfig"
import styles from "./fees.module.css"
import Sidebar from "../../components/Sidebar"
import { AppContext } from "../../context/AppContext"

const Fees = () => {
  const { isOpen } = useContext(AppContext)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    class: "",
    section: "",
  })
  const [hasSearched, setHasSearched] = useState(false)
  const [partialPayment, setPartialPayment] = useState({
    term: "",
    amount: "",
    isPreviousClass: false,
  })

  const fetchStudents = async () => {
    if (!filters.class || !filters.section) return

    try {
      setLoading(true)
      const currentClass = parseInt(filters.class)
      const previousClass = currentClass - 1

      const q = query(
        collection(db, "students"),
        where("classId", "==", filters.class),
        where("sectionId", "==", filters.section)
      )

      const querySnapshot = await getDocs(q)
      const studentsData = []

      for (const doc of querySnapshot.docs) {
        const data = doc.data()
        const feeHistory = data.feeHistory || {}

        const currentFeeData = feeHistory[`classId${currentClass}`] || {
          term1: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
          term2: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
          totalFee: 0,
          updatedAt: new Date(),
        }

        let previousTerm1Pending = 0
        let previousTerm2Pending = 0
        let previousFeeData = {}
        if (previousClass > 0 && feeHistory[`classId${previousClass}`]) {
          previousFeeData = feeHistory[`classId${previousClass}`]
          previousTerm1Pending =
            previousFeeData.term1.amount - previousFeeData.term1.paidAmount
          previousTerm2Pending =
            previousFeeData.term2.amount - previousFeeData.term2.paidAmount
        }

        studentsData.push({
          id: doc.id,
          ...data,
          feeHistory,
          currentFeeData,
          previousFeeData,
          previousPending: {
            term1: previousTerm1Pending,
            term2: previousTerm2Pending,
            total: previousTerm1Pending + previousTerm2Pending,
          },
        })
      }

      setStudents(studentsData)
      setHasSearched(true)
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFeeStatus = async (term, status, isPreviousClass = false) => {
    if (!selectedStudent) return

    try {
      setLoading(true)
      const studentRef = doc(db, "students", selectedStudent.id)
      const classToUpdate = isPreviousClass
        ? parseInt(selectedStudent.classId) - 1
        : parseInt(selectedStudent.classId)

      if (classToUpdate < 1) return // No previous class for class 1

      const feeKey = `classId${classToUpdate}`
      const currentFeeData = selectedStudent.feeHistory?.[feeKey] || {
        term1: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
        term2: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
        totalFee: 0,
      }

      const updatedTerm = {
        ...currentFeeData[term],
        status,
        paidAmount: status === "paid" ? currentFeeData[term].amount : 0,
      }

      const updatedFees = {
        ...currentFeeData,
        [term]: updatedTerm,
        updatedAt: new Date(),
      }

      await updateDoc(studentRef, {
        [`feeHistory.${feeKey}`]: updatedFees,
        lastFeeUpdate: new Date(),
      })

      const updatedStudent = {
        ...selectedStudent,
        feeHistory: {
          ...selectedStudent.feeHistory,
          [feeKey]: updatedFees,
        },
      }

      setSelectedStudent(updatedStudent)
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
      )
    } catch (error) {
      console.error("Error updating fee status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePartialPayment = async (term, isPreviousClass = false) => {
    if (
      !selectedStudent ||
      !partialPayment.amount ||
      isNaN(partialPayment.amount)
    )
      return

    try {
      setLoading(true)
      const studentRef = doc(db, "students", selectedStudent.id)
      const classToUpdate = isPreviousClass
        ? parseInt(selectedStudent.classId) - 1
        : parseInt(selectedStudent.classId)

      if (classToUpdate < 1) return

      const feeKey = `classId${classToUpdate}`
      const currentFeeData = selectedStudent.feeHistory?.[feeKey] || {
        term1: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
        term2: { amount: 0, paidAmount: 0, status: "pending", dueDate: "" },
        totalFee: 0,
      }

      const paymentAmount = parseFloat(partialPayment.amount)
      const currentTermData = currentFeeData[term] || {
        amount: 0,
        paidAmount: 0,
        status: "pending",
      }

      const newPaidAmount = (currentTermData.paidAmount || 0) + paymentAmount
      const newStatus =
        newPaidAmount >= (currentTermData.amount || 0) ? "paid" : "pending"

      const updatedTerm = {
        ...currentTermData,
        paidAmount: newPaidAmount,
        status: newStatus,
      }

      const updatedFees = {
        ...currentFeeData,
        [term]: updatedTerm,
        updatedAt: new Date(),
      }

      await updateDoc(studentRef, {
        [`feeHistory.${feeKey}`]: updatedFees,
        lastFeeUpdate: new Date(),
      })

      const updatedStudent = {
        ...selectedStudent,
        feeHistory: {
          ...selectedStudent.feeHistory,
          [feeKey]: updatedFees,
        },
      }

      setSelectedStudent(updatedStudent)
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
      )
      setPartialPayment({ term: "", amount: "", isPreviousClass: false })
    } catch (error) {
      console.error("Error updating partial payment:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePendingAmount = (term, isPreviousClass = false) => {
    if (!selectedStudent) return 0
    const classToCheck = isPreviousClass
      ? parseInt(selectedStudent.classId) - 1
      : parseInt(selectedStudent.classId)

    if (classToCheck < 1) return 0 // No previous class for class 1

    const feeKey = `classId${classToCheck}`
    const termData = selectedStudent.feeHistory?.[feeKey]?.[term] || {}
    return (termData.amount || 0) - (termData.paidAmount || 0)
  }

  const renderTermCard = (term, isPreviousClass = false) => {
    if (!selectedStudent) return null

    const classToShow = isPreviousClass
      ? parseInt(selectedStudent.classId) - 1
      : parseInt(selectedStudent.classId)

    if (classToShow < 1 && isPreviousClass) return null

    const feeKey = `classId${classToShow}`
    const termData = selectedStudent.feeHistory?.[feeKey]?.[term] || {}
    const isPaid = termData.status === "paid"
    const pendingAmount = calculatePendingAmount(term, isPreviousClass)

    if (isPreviousClass && pendingAmount <= 0) return null

    return (
      <div
        className={`${styles.termCard} ${
          isPreviousClass ? styles.previousTermCard : ""
        }`}
        key={`${term}-${isPreviousClass}`}
      >
        <h4 className={styles.termTitle}>
          {term === "term1" ? "Term 1" : "Term 2"} Fees{" "}
          {isPreviousClass ? `(Class ${classToShow})` : ""}
        </h4>
        <div className={styles.detailsGrid}>
          <div>
            <p className={styles.detailLabel}>Amount</p>
            <p className={styles.detailValue}>₹{termData.amount || 0}</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Due Date</p>
            <p className={styles.detailValue}>
              {termData.dueDate || "Not set"}
            </p>
          </div>
          <div>
            <p className={styles.detailLabel}>Paid Amount</p>
            <p className={styles.detailValue}>₹{termData.paidAmount || 0}</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Pending Amount</p>
            <p className={styles.detailValue}>₹{pendingAmount}</p>
          </div>
          <div>
            <p className={styles.detailLabel}>Status</p>
            <p
              className={`${styles.detailValue} ${styles.statusValue} ${
                isPaid ? styles.paidStatus : styles.pendingStatus
              }`}
            >
              {termData.status || "pending"}
            </p>
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => updateFeeStatus(term, "paid", isPreviousClass)}
            disabled={isPaid}
            className={`${styles.actionButton} ${styles.paidButton}`}
          >
            Mark as Paid
          </button>
          <button
            onClick={() => updateFeeStatus(term, "pending", isPreviousClass)}
            disabled={!isPaid}
            className={`${styles.actionButton} ${styles.pendingButton}`}
          >
            Mark as Pending
          </button>
        </div>
        <div className={styles.partialPaymentContainer}>
          <h5 className={styles.termTitle}>Record Partial Payment</h5>
          <input
            type="number"
            value={
              partialPayment.term === term &&
              partialPayment.isPreviousClass === isPreviousClass
                ? partialPayment.amount
                : ""
            }
            onChange={(e) =>
              setPartialPayment({
                term,
                amount: e.target.value,
                isPreviousClass,
              })
            }
            className={styles.partialPaymentInput}
            placeholder="Enter amount paid"
            disabled={isPaid}
          />
          <button
            onClick={() => handlePartialPayment(term, isPreviousClass)}
            disabled={
              !partialPayment.amount ||
              partialPayment.term !== term ||
              partialPayment.isPreviousClass !== isPreviousClass ||
              isPaid
            }
            className={styles.partialPaymentButton}
          >
            Record Payment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div
        className={`${styles.mainContent} ${
          isOpen ? styles.blurredContent : ""
        }`}
      >
        <h1 className={styles.title}>Student Fees Management</h1>

        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Class*</label>
            <input
              type="number"
              value={filters.class}
              onChange={(e) =>
                setFilters({ ...filters, class: e.target.value })
              }
              className={styles.filterInput}
              placeholder="Enter class"
              min="1"
              max="10"
              required
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Section*</label>
            <input
              type="text"
              value={filters.section}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  section: e.target.value.toUpperCase(),
                })
              }
              className={styles.filterInput}
              placeholder="Enter section"
              required
            />
          </div>
          <button
            onClick={fetchStudents}
            className={styles.applyButton}
            disabled={!filters.class || !filters.section || loading}
          >
            {loading ? "Searching..." : "Search Students"}
          </button>
        </div>

        {!hasSearched ? (
          <div className={styles.searchPrompt}>
            <p>Please select a class and section to view students</p>
          </div>
        ) : students.length === 0 ? (
          <div className={styles.studentsList}>
            <h2 className={styles.listTitle}>Students</h2>
            <p>No students found for the selected class and section.</p>
          </div>
        ) : (
          <div className={styles.studentsList}>
            <h2 className={styles.listTitle}>Students</h2>
            <ul className={styles.studentList}>
              {students.map((student) => {
                const currentClass = parseInt(student.classId)
                const feeData = student.feeHistory?.[
                  `classId${currentClass}`
                ] || {
                  term1: { status: "pending" },
                  term2: { status: "pending" },
                }
                return (
                  <li
                    key={student.id}
                    className={styles.studentItem}
                    onClick={() => {
                      setSelectedStudent(student)
                      setIsModalOpen(true)
                    }}
                  >
                    <div className={styles.studentHeader}>
                      <span className={styles.studentName}>
                        {student.studentName || `Student ${student.id}`}
                      </span>
                      <span className={styles.studentClass}>
                        Class {student.classId}, Section {student.sectionId}
                      </span>
                    </div>
                    <div className={styles.statusContainer}>
                      <span
                        className={`${styles.statusBadge} ${
                          feeData.term1.status === "paid"
                            ? styles.paidStatus
                            : styles.pendingStatus
                        }`}
                      >
                        Term 1: {feeData.term1.status}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          feeData.term2.status === "paid"
                            ? styles.paidStatus
                            : styles.pendingStatus
                        }`}
                      >
                        Term 2: {feeData.term2.status}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {isModalOpen && selectedStudent && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitles}>
                  <h3 className={styles.modalTitle}>
                    {selectedStudent.studentName ||
                      `Student ${selectedStudent.id}`}
                  </h3>
                  <p className={styles.studentInfo}>
                    Class {selectedStudent.classId}, Section{" "}
                    {selectedStudent.sectionId}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className={styles.closeButton}
                >
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
                {parseInt(selectedStudent.classId) > 1 &&
                  selectedStudent.previousPending?.total > 0 && (
                    <div className={styles.previousPendingSection}>
                      <h3 className={styles.previousPendingTitle}>
                        Previous Class (Class{" "}
                        {parseInt(selectedStudent.classId) - 1}) Pending Fees
                      </h3>
                      <div className={styles.previousTermsContainer}>
                        {renderTermCard("term1", true)}
                        {renderTermCard("term2", true)}
                      </div>
                    </div>
                  )}

                <div className={styles.currentTermsSection}>
                  <h3 className={styles.currentTermsTitle}>
                    Current Class Fees
                  </h3>
                  <div className={styles.modalTotalFee}>
                    Total Current Fee: ₹
                    {selectedStudent.feeHistory?.[
                      `classId${parseInt(selectedStudent.classId)}`
                    ]?.totalFee || 0}
                  </div>
                  <div className={styles.termsContainer}>
                    {renderTermCard("term1")}
                    {renderTermCard("term2")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Fees
