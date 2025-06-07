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
  const { formatIndianNumber, isOpen } = useContext(AppContext)
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    class: "",
    section: "",
  })
  const [hasSearched, setHasSearched] = useState(false)

  const fetchStudents = async () => {
    if (!filters.class || !filters.section) return

    try {
      setLoading(true)
      let q = query(
        collection(db, "students"),
        where("classId", "==", filters.class),
        where("sectionId", "==", filters.section)
      )

      const querySnapshot = await getDocs(q)
      const studentsData = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (!data.fees) {
          data.fees = {
            term1: { amount: 0, dueDate: "", paidAmount: 0, status: "pending" },
            term2: { amount: 0, dueDate: "", paidAmount: 0, status: "pending" },
          }
        }
        studentsData.push({ id: doc.id, ...data })
      })
      setStudents(studentsData)
      setHasSearched(true)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching students:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateFeeStatus = async (term, status) => {
    if (!selectedStudent) return

    try {
      const studentRef = doc(db, "students", selectedStudent.id)
      const updatedFees = {
        ...selectedStudent.fees,
        [term]: {
          ...selectedStudent.fees[term],
          status: status,
          paidAmount: status === "paid" ? selectedStudent.fees[term].amount : 0,
        },
      }

      await updateDoc(studentRef, {
        fees: updatedFees,
      })

      setSelectedStudent({
        ...selectedStudent,
        fees: updatedFees,
      })

      setStudents(
        students.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, fees: updatedFees }
            : student
        )
      )
    } catch (error) {
      console.error("Error updating fee status:", error)
    }
  }

  const [partialPayment, setPartialPayment] = useState({
    term: "",
    amount: "",
  })

  const handlePartialPayment = async (term) => {
    if (
      !selectedStudent ||
      !partialPayment.amount ||
      isNaN(partialPayment.amount)
    )
      return

    try {
      const paymentAmount = parseFloat(partialPayment.amount)
      const studentRef = doc(db, "students", selectedStudent.id)

      const updatedFees = {
        ...selectedStudent.fees,
        [term]: {
          ...selectedStudent.fees[term],
          paidAmount: selectedStudent.fees[term].paidAmount + paymentAmount,
          status:
            selectedStudent.fees[term].paidAmount + paymentAmount >=
            selectedStudent.fees[term].amount
              ? "paid"
              : "pending",
        },
      }

      await updateDoc(studentRef, {
        fees: updatedFees,
      })

      setSelectedStudent({
        ...selectedStudent,
        fees: updatedFees,
      })

      setStudents(
        students.map((student) =>
          student.id === selectedStudent.id
            ? { ...student, fees: updatedFees }
            : student
        )
      )
      setPartialPayment({ term: "", amount: "" })
    } catch (error) {
      console.error("Error updating partial payment:", error)
    }
  }

  const calculatePendingAmount = (term) => {
    if (!selectedStudent) return 0
    return (
      selectedStudent.fees[term].amount - selectedStudent.fees[term].paidAmount
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
              min={1}
              max={10}
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
            disabled={!filters.class || !filters.section}
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
            <ul>
              {students.map((student) => (
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
                        student.fees.term1.status === "paid"
                          ? styles.paidStatus
                          : styles.pendingStatus
                      }`}
                    >
                      Term 1: {student.fees.term1.status}
                    </span>
                    <span
                      className={`${styles.statusBadge} ${
                        student.fees.term2.status === "paid"
                          ? styles.paidStatus
                          : styles.pendingStatus
                      }`}
                    >
                      Term 2: {student.fees.term2.status}
                    </span>
                  </div>
                </li>
              ))}
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
                <div className={styles.modalTotalFee}>
                  Total Fee:{" "}
                  {selectedStudent.fees.totalFee
                    ? selectedStudent.fees.totalFee
                    : 0}
                </div>
                <div>
                  <div className={styles.termCard}>
                    <h4 className={styles.termTitle}>Term 1 Fees</h4>
                    <div className={styles.detailsGrid}>
                      <div>
                        <p className={styles.detailLabel}>Amount</p>
                        <p className={styles.detailValue}>
                          ₹{selectedStudent.fees.term1.amount}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Due Date</p>
                        <p className={styles.detailValue}>
                          {selectedStudent.fees.term1.dueDate}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Paid Amount</p>
                        <p className={styles.detailValue}>
                          ₹{selectedStudent.fees.term1.paidAmount}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Pending Amount</p>
                        <p className={styles.detailValue}>
                          ₹{calculatePendingAmount("term1")}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Status</p>
                        <p
                          className={`${styles.detailValue} ${
                            styles.statusValue
                          } ${
                            selectedStudent.fees.term1.status === "paid"
                              ? styles.paidStatus
                              : styles.pendingStatus
                          }`}
                        >
                          {selectedStudent.fees.term1.status}
                        </p>
                      </div>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => updateFeeStatus("term1", "paid")}
                        disabled={selectedStudent.fees.term1.status === "paid"}
                        className={`${styles.actionButton} ${styles.paidButton}`}
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => updateFeeStatus("term1", "pending")}
                        disabled={
                          selectedStudent.fees.term1.status === "pending"
                        }
                        className={`${styles.actionButton} ${styles.pendingButton}`}
                      >
                        Mark as Pending
                      </button>
                    </div>
                    <div className={styles.partialPaymentContainer}>
                      <h5 className={styles.termTitle}>
                        Record Partial Payment
                      </h5>
                      <input
                        type="text"
                        value={
                          partialPayment.term === "term1"
                            ? formatIndianNumber(partialPayment.amount)
                            : ""
                        }
                        onChange={(e) =>
                          setPartialPayment({
                            term: "term1",
                            amount: e.target.value,
                          })
                        }
                        className={styles.partialPaymentInput}
                        placeholder="Enter amount paid"
                        disabled={selectedStudent.fees.term1.status === "paid"}
                      />
                      <button
                        onClick={() => handlePartialPayment("term1")}
                        disabled={
                          !partialPayment.amount ||
                          partialPayment.term !== "term1" ||
                          selectedStudent.fees.term1.status === "paid"
                        }
                        className={styles.partialPaymentButton}
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>

                  <div className={styles.termCard}>
                    <h4 className={styles.termTitle}>Term 2 Fees</h4>
                    <div className={styles.detailsGrid}>
                      <div>
                        <p className={styles.detailLabel}>Amount</p>
                        <p className={styles.detailValue}>
                          ₹{selectedStudent.fees.term2.amount}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Due Date</p>
                        <p className={styles.detailValue}>
                          {selectedStudent.fees.term2.dueDate}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Paid Amount</p>
                        <p className={styles.detailValue}>
                          ₹{selectedStudent.fees.term2.paidAmount}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Pending Amount</p>
                        <p className={styles.detailValue}>
                          ₹{calculatePendingAmount("term2")}
                        </p>
                      </div>
                      <div>
                        <p className={styles.detailLabel}>Status</p>
                        <p
                          className={`${styles.detailValue} ${
                            styles.statusValue
                          } ${
                            selectedStudent.fees.term2.status === "paid"
                              ? styles.paidStatus
                              : styles.pendingStatus
                          }`}
                        >
                          {selectedStudent.fees.term2.status}
                        </p>
                      </div>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button
                        onClick={() => updateFeeStatus("term2", "paid")}
                        disabled={selectedStudent.fees.term2.status === "paid"}
                        className={`${styles.actionButton} ${styles.paidButton}`}
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => updateFeeStatus("term2", "pending")}
                        disabled={
                          selectedStudent.fees.term2.status === "pending"
                        }
                        className={`${styles.actionButton} ${styles.pendingButton}`}
                      >
                        Mark as Pending
                      </button>
                    </div>
                    <div className={styles.partialPaymentContainer}>
                      <h5 className={styles.termTitle}>
                        Record Partial Payment
                      </h5>
                      <input
                        type="text"
                        value={
                          partialPayment.term === "term2"
                            ? formatIndianNumber(partialPayment.amount)
                            : ""
                        }
                        onChange={(e) =>
                          setPartialPayment({
                            term: "term2",
                            amount: e.target.value,
                          })
                        }
                        className={styles.partialPaymentInput}
                        placeholder="Enter amount paid"
                        disabled={selectedStudent.fees.term2.status === "paid"}
                      />
                      <button
                        onClick={() => handlePartialPayment("term2")}
                        disabled={
                          !partialPayment.amount ||
                          partialPayment.term !== "term2" ||
                          selectedStudent.fees.term2.status === "paid"
                        }
                        className={styles.partialPaymentButton}
                      >
                        Record Payment
                      </button>
                    </div>
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
