import { useContext, useState } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, School, Edit, Trash2, X } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/Schools.module.css"
import { AppContext } from "../../context/AppContext"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import { logActivity } from "../../utils/logActivity"

const Schools = () => {
  const {
    search,
    setSearch,
    filteredSchools,
    isOpen,
    setSchools,
    success,
    failure,
  } = useContext(AppContext)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    principal: "",
    address: "",
    students: "",
    teachers: "",
    email: "",
    phone: "",
    shortName: "",
  })

  const handleEditClick = (school) => {
    setSelectedSchool(school)
    setFormData({
      name: school.name || "",
      principal: school.principal || "",
      address: school.address || "",
      students: school.students || 0,
      teachers: school.teachers || 0,
      email: school.email || "",
      phone: school.phone || "",
      shortName: school.shortName || "",
    })
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (school) => {
    setSelectedSchool(school)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedSchool(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const updateSchool = doc(firestore, "schools", selectedSchool.id)
      await updateDoc(updateSchool, {
        principal: formData.principal,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      })
      success(`School ${formData.name} has updated successfully`)
      await logActivity(`Successfully updated school ${formData.name}`, "Admin")
      setLoading(false)
    } catch (error) {
      failure(error)
    } finally {
      setLoading(false)
    }
    handleCloseModal()
  }

  const confirmDelete = async () => {
    if (selectedSchool) {
      try {
        const schoolId = selectedSchool.id

        const studentsQuery = query(
          collection(firestore, "students"),
          where("schoolId", "==", schoolId)
        )
        const studentsSnapshot = await getDocs(studentsQuery)
        const studentDeletes = studentsSnapshot.docs.map((docSnap) =>
          deleteDoc(doc(firestore, "students", docSnap.id))
        )
        await Promise.all(studentDeletes)

        const teachersQuery = query(
          collection(firestore, "teachers"),
          where("schoolId", "==", schoolId)
        )
        const teachersSnapshot = await getDocs(teachersQuery)
        const teacherDeletes = teachersSnapshot.docs.map((docSnap) =>
          deleteDoc(doc(firestore, "teachers", docSnap.id))
        )
        await Promise.all(teacherDeletes)

        await deleteDoc(doc(firestore, "schools", schoolId))

        setSchools((prev) => prev.filter((s) => s.id !== schoolId))
        await logActivity(`Deleted school: ${selectedSchool.name}`, "Admin")
        success("School, students, and teachers deleted successfully.")
      } catch (error) {
        console.error("Error deleting school and its children:", error)
        failure("Failed to delete school. Please try again.")
      }
      handleCloseModal()
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
            <h1>Schools</h1>
            <Link to="/schools/add" className={styles.addButton}>
              <Plus size={18} />
              <span>Add School</span>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className={styles.actionButtons}>
                <button className={styles.filterButton}>Filter</button>
                <button className={styles.exportButton}>Export</button>
              </div>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.desktopTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Principal</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSchools.length === 0 ? (
                    <tr>
                      <td colSpan="6" className={styles.noResults}>
                        No schools found.
                      </td>
                    </tr>
                  ) : (
                    filteredSchools.map((school) => (
                      <tr key={school.id}>
                        <td>
                          <div className={styles.schoolInfo}>
                            <div className={styles.schoolIcon}>
                              <School size={18} />
                            </div>
                            <div>{school.name}</div>
                          </div>
                        </td>
                        <td>{school.principal ?? "-"}</td>
                        <td>{school.students ?? "-"}</td>
                        <td>{school.teachers ?? "-"}</td>
                        <td className={styles.addressCell}>{school.address}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(school)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteClick(school)}
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
              {filteredSchools.length === 0 ? (
                <div className={styles.noResults}>No schools found.</div>
              ) : (
                filteredSchools.map((school) => (
                  <div key={school.id} className={styles.schoolCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.schoolInfo}>
                        <div className={styles.schoolIcon}>
                          <School size={20} />
                        </div>
                        <div>
                          <h3>{school.name}</h3>
                          <p className={styles.principal}>
                            <span>Principal: </span>
                            <span>{school.principal || "-"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.detailRow}>
                        <span>Students:</span>
                        <span>{school.students || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Teachers:</span>
                        <span>{school.teachers || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Address:</span>
                        <span className={styles.addressText}>
                          {school.address || "-"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditClick(school)}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(school)}
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
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.schoolAvatar}>
                <School size={24} />
              </div>
              <h2>Edit School Details</h2>
              <button onClick={handleCloseModal} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>School Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className={styles.readOnlyInput}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Principal Name</label>
                  <input
                    type="text"
                    name="principal"
                    value={formData.principal}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Number of Students</label>
                  <input
                    type="number"
                    name="students"
                    value={formData.students}
                    readOnly
                    className={styles.readOnlyInput}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Number of Teachers</label>
                  <input
                    type="number"
                    name="teachers"
                    value={formData.teachers}
                    readOnly
                    className={styles.readOnlyInput}
                    style={{ cursor: "not-allowed" }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={10}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                />
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
              <h2>Delete School</h2>
            </div>

            <div className={styles.deleteModalBody}>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedSchool?.name}</strong>? This action cannot be
                undone.
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
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schools
