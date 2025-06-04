import { useContext, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Edit, Plus, Search, Trash2, User, X } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/Schools.module.css"
import { AppContext } from "../../context/AppContext"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import { logActivity } from "../../utils/logActivity"

const Students = () => {
  const {
    filteredStudents,
    searchStudentTerm,
    setSearchStudentTerm,
    isOpen,
    success,
    failure,
    fetchStudentsWithSchoolNames,
    adminDetails,
  } = useContext(AppContext)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    studentName: "",
    admissionNumber: "",
    classId: "",
    sectionId: "",
    email: "",
    address: "",
    dob: "",
    bloodGroup: "",
    father: {
      name: "",
      phone: "",
      email: "",
      occupation: "",
    },
    mother: {
      name: "",
      phone: "",
      email: "",
      occupation: "",
    },
  })

  const handleEditClick = (student) => {
    setSelectedStudent(student)
    setFormData({
      studentName: student.studentName || "",
      admissionNumber: student.admissionNumber || "",
      classId: student.classId || "",
      sectionId: student.sectionId || "",
      email: student.studentEmail || student.email || "",
      address: student.address || "",
      dob: student.dob || "",
      bloodGroup: student.bloodGroup || "",
      father: student.parents?.father || {
        name: "",
        phone: "",
        email: "",
        occupation: "",
      },
      mother: student.parents?.mother || {
        name: "",
        phone: "",
        email: "",
        occupation: "",
      },
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (student) => {
    setSelectedStudent(student)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedStudent(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleParentChange = (e, parentType) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [parentType]: {
        ...prev[parentType],
        [name]: value,
      },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const updateStudent = doc(firestore, "students", selectedStudent.id)
      await updateDoc(updateStudent, {
        studentName: formData.studentName,
        admissionNumber: formData.admissionNumber,
        classId: formData.classId,
        sectionId: formData.sectionId.toUpperCase(),
        studentEmail: formData.email,
        address: formData.address,
        dob: formData.dob,
        bloodGroup: formData.bloodGroup,
        parents: {
          father: formData.father,
          mother: formData.mother,
        },
      })
      success(`Student ${formData.studentName} has been updated successfully`)
      await logActivity(
        `Successfully updated student ${formData.studentName}`,
        adminDetails.adminType !== "school-admin" ? "Admin" : "School Admin"
      )
      const email =
        formData.father.email?.trim() || formData.mother.email?.trim()
      const fatherName = formData.father.name?.trim()
      if (email) {
        const schoolDomain = adminDetails.schoolDomain || "sshs.com"
        const username = `${formData.admissionNumber}@${schoolDomain}`
        const password = `${formData.admissionNumber}@123`
        await fetch(
          "https://push-notifications-backend-ashen.vercel.app/api/sendSMS",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              toEmail: email,
              fatherName,
              username,
              password,
              studentName: formData.studentName,
            }),
          }
        )
      }
      setLoading(false)
    } catch (error) {
      failure(error)
    } finally {
      setLoading(false)
    }
    handleCloseModal()
  }

  const confirmDelete = async () => {
    if (selectedStudent) {
      try {
        await deleteDoc(doc(firestore, "students", selectedStudent.id))
        success("Student deleted successfully.")
        await logActivity(
          `Deleted student: ${selectedStudent.studentName}`,
          "Admin"
        )
      } catch (error) {
        console.error("Error deleting student:", error)
        failure("Failed to delete student. Please try again.")
      }
      handleCloseModal()
    }
  }

  useEffect(() => {
    fetchStudentsWithSchoolNames()
  }, [fetchStudentsWithSchoolNames])

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
            <h1>Students</h1>
            <Link to="/students/add" className={styles.addButton}>
              <Plus size={18} />
              <span>Add Student</span>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search students | school | Father Name"
                  value={searchStudentTerm}
                  onChange={(e) => setSearchStudentTerm(e.target.value)}
                />
              </div>
              {/* <div className={styles.actionButtons}>
                <button className={styles.filterButton}>Filter</button>
                <button className={styles.exportButton}>Export</button>
              </div> */}
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.desktopTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>School</th>
                    <th>Admission Number</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Father's Name</th>
                    <th>Father's Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9">No students found.</td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className={styles.schoolInfo}>
                            <div className={styles.schoolIcon}>
                              <User size={18} />
                            </div>
                            <div>{student.studentName || "-"}</div>
                          </div>
                        </td>
                        <td>{student.schoolName || "-"}</td>
                        <td>{student.admissionNumber || "-"}</td>
                        <td>{student.classId || "-"}</td>
                        <td>{student.sectionId || "-"}</td>
                        <td>{student.parents?.father?.name || "-"}</td>
                        <td>{student.parents?.father?.phone || "-"}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(student)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteClick(student)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.mobileCards}>
              {filteredStudents.length === 0 ? (
                <div className={styles.noResults}>No students found.</div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className={styles.schoolCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.schoolInfo}>
                        <div className={styles.schoolIcon}>
                          <User size={18} />
                        </div>
                        <div>
                          <h3>{student.studentName || "-"}</h3>
                          <p className={styles.principal}>
                            <span>Roll No: </span>
                            <span>{student.admissionNumber || "-"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.detailRow}>
                        <span>School:</span>
                        <span>{student.schoolName || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Class:</span>
                        <span>{student.classId || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Section:</span>
                        <span>{student.sectionId || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Father:</span>
                        <span>{student.parents?.father?.name || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Father's Phone:</span>
                        <span>{student.parents?.father?.phone || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Mother:</span>
                        <span>{student.parents?.mother?.name || "-"}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditClick(student)}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(student)}
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {isEditModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: "800px" }}>
            <div className={styles.modalHeader}>
              <div className={styles.schoolAvatar}>
                <User size={24} />
              </div>
              <h2>Edit Student Details</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Student Name</label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Admission Number</label>
                  <input
                    type="text"
                    name="admissionNumber"
                    value={formData.admissionNumber}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Class</label>
                  <input
                    type="text"
                    name="classId"
                    value={formData.classId}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Section</label>
                  <input
                    type="text"
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    required
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
                  </select>
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <div className={styles.sectionDivider}>
                  <span>Father's Information</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Father's Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.father.name}
                    onChange={(e) => handleParentChange(e, "father")}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Father's Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.father.phone}
                    onChange={(e) => handleParentChange(e, "father")}
                    maxLength={10}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Father's Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.father.email}
                    onChange={(e) => handleParentChange(e, "father")}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Father's Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.father.occupation}
                    onChange={(e) => handleParentChange(e, "father")}
                    required
                  />
                </div>

                <div className={styles.sectionDivider}>
                  <span>Mother's Information</span>
                </div>

                <div className={styles.formGroup}>
                  <label>Mother's Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.mother.name}
                    onChange={(e) => handleParentChange(e, "mother")}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mother's Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.mother.phone}
                    onChange={(e) => handleParentChange(e, "mother")}
                    required
                    maxLength={10}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mother's Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.mother.email}
                    onChange={(e) => handleParentChange(e, "mother")}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Mother's Occupation</label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.mother.occupation}
                    onChange={(e) => handleParentChange(e, "mother")}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryButton}>
                  {loading ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModalContent}>
            <div className={styles.deleteModalHeader}>
              <Trash2 size={24} className={styles.deleteIcon} />
              <h2>Delete Student</h2>
            </div>

            <div className={styles.deleteModalBody}>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedStudent?.studentName}</strong>? This action
                cannot be undone.
              </p>
            </div>

            <div className={styles.deleteModalFooter}>
              <button
                onClick={handleCloseModal}
                className={styles.cancelDeleteButton}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete()}
                className={styles.confirmDeleteButton}
              >
                <Trash2 size={16} /> {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Students
