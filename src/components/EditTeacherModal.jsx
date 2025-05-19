import { useState, useEffect, useContext } from "react"
import { User, X, Plus } from "lucide-react"
import styles from "./styles/EditTeacherModal.module.css"
import { doc, updateDoc } from "firebase/firestore"
import { firestore } from "../firebase/firebaseConfig"
import { AppContext } from "../context/AppContext"
import { logActivity } from "../utils/logActivity"

const EditTeacherModal = ({ teacher, onClose }) => {
  const { success, failure } = useContext(AppContext)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    schoolId: "",
    assignments: [],
  })

  const [newAssignment, setNewAssignment] = useState({
    class: "",
    section: "",
    subject: "",
  })

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        email: teacher.email || "",
        phone: teacher.phone || "",
        schoolId: teacher.schoolId || "",
        assignments: teacher.assignments ? [...teacher.assignments] : [],
      })
    }
  }, [teacher])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target
    setNewAssignment((prev) => ({
      ...prev,
      [name]: name === "section" ? value.toUpperCase() : value,
    }))
  }

  const handleAddAssignment = () => {
    if (newAssignment.class && newAssignment.subject) {
      setFormData((prev) => ({
        ...prev,
        assignments: [...prev.assignments, newAssignment],
      }))
      setNewAssignment({
        class: "",
        section: "",
        subject: "",
      })
    }
  }

  const handleRemoveAssignment = (index) => {
    setFormData((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const teacherRef = doc(firestore, "teachers", teacher.id)
      await updateDoc(teacherRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        assignments: formData.assignments,
      })
      success(`Teacher ${formData.name} has updated successfully`)
      await logActivity(
        `Successfully updated teacher ${formData.name}`,
        "Admin"
      )
      onClose()
      setLoading(false)
    } catch (error) {
      failure("Error updating teacher:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.teacherAvatar}>
            <User size={24} />
          </div>
          <h2>Edit Teacher Profile</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                maxLength={10}
              />
            </div>
          </div>

          <div className={styles.sectionDivider}>
            <span>Class Assignments</span>
          </div>

          {formData.assignments.length > 0 ? (
            <div className={styles.assignmentsContainer}>
              {formData.assignments.map((assignment, index) => (
                <div key={index} className={styles.assignmentCard}>
                  <div className={styles.assignmentInfo}>
                    <span className={styles.subjectBadge}>
                      {assignment.subject}
                    </span>
                    <span>
                      Class {assignment.class}
                      {assignment.section && `-${assignment.section}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(index)}
                    className={styles.removeAssignment}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No assignments added yet</p>
            </div>
          )}

          <div className={styles.addAssignmentSection}>
            <h4>Add New Assignment</h4>
            <div className={styles.assignmentForm}>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="subject"
                  value={newAssignment.subject}
                  onChange={handleAssignmentChange}
                  placeholder="SUBJECT"
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="number"
                  name="class"
                  value={newAssignment.class}
                  onChange={handleAssignmentChange}
                  placeholder="CLASS"
                  max={10}
                  min={1}
                />
              </div>
              <div className={styles.formGroup}>
                <input
                  type="text"
                  name="section"
                  value={newAssignment.section}
                  onChange={handleAssignmentChange}
                  placeholder="Section"
                  style={{ textTransform: "uppercase" }}
                  maxLength={1}
                />
              </div>
              <button
                type="button"
                onClick={handleAddAssignment}
                className={styles.addAssignmentButton}
                disabled={
                  !newAssignment.subject ||
                  !newAssignment.class ||
                  !newAssignment.section
                }
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
            >
              Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              {loading ? "Updaing..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditTeacherModal
