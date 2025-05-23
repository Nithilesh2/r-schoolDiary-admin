import { Link } from "react-router-dom"
import { Edit, Plus, Search, Trash2, User, X } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "../Schools/styles/Schools.module.css"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../../context/AppContext"
import EditTeacherModal from "../../components/EditTeacherModal"

const Teachers = () => {
  const {
    searchTeacherTerm,
    setSearchTeacherTerm,
    filteredTeachers,
    isOpen,
    handleDeleteTeacher,
    fetchTeachersWithSchoolNames,
  } = useContext(AppContext)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher)
    setIsEditModalOpen(true)
  }

  const handleDeleteClick = (teacher) => {
    setSelectedTeacher(teacher)
    setIsDeleteModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedTeacher(null)
  }

  const confirmDelete = () => {
    if (selectedTeacher) {
      handleDeleteTeacher(selectedTeacher)
      handleCloseModal()
    }
  }

  useEffect(() => {
    fetchTeachersWithSchoolNames()
  }, [fetchTeachersWithSchoolNames])

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
            <h1>Teachers</h1>
            <Link to="/teachers/add" className={styles.addButton}>
              <Plus size={18} />
              <span>Add Teacher</span>
            </Link>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search teacher | mail | school"
                  value={searchTeacherTerm}
                  onChange={(e) =>
                    setSearchTeacherTerm(e.target.value.toLowerCase())
                  }
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
                    <th>Subjects</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan="6">No teachers found.</td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td>
                          <div className={styles.schoolInfo}>
                            <div className={styles.schoolIcon}>
                              <User size={18} />
                            </div>
                            <div>{teacher.name || "-"}</div>
                          </div>
                        </td>
                        <td>{teacher.schoolName || "-"}</td>
                        <td>
                          {Array.isArray(teacher.assignments) &&
                          teacher.assignments.length > 0
                            ? teacher.assignments.map((assignment, index) => (
                                <div key={index}>
                                  {assignment.subject || "-"} - Class{" "}
                                  {assignment.class || "-"}
                                  {assignment.section
                                    ? `-${assignment.section}`
                                    : ""}
                                </div>
                              ))
                            : "-"}
                        </td>
                        <td>{teacher.phone || "-"}</td>
                        <td>{teacher.email || "-"}</td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.editButton}
                              onClick={() => handleEditClick(teacher)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeleteClick(teacher)}
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
              {filteredTeachers.length === 0 ? (
                <div className={styles.noResults}>No teachers found.</div>
              ) : (
                filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className={styles.schoolCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.schoolInfo}>
                        <div className={styles.schoolIcon}>
                          <User size={18} />
                        </div>
                        <div>
                          <h3>{teacher.name || "-"}</h3>
                          <p className={styles.principal}>
                            <span>School: </span>
                            <span>{teacher.schoolName || "-"}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardBody}>
                      <div className={styles.detailRow}>
                        <span>Phone:</span>
                        <span>{teacher.phone || "-"}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span>Email:</span>
                        <span>{teacher.email || "-"}</span>
                      </div>
                      <div
                        className={`${styles.detailRow} ${styles.fullWidth}`}
                      >
                        <span>Subjects & Classes:</span>
                        <div className={styles.assignmentsList}>
                          {Array.isArray(teacher.assignments) &&
                          teacher.assignments.length > 0
                            ? teacher.assignments.map((assignment, index) => (
                                <div
                                  key={index}
                                  className={styles.assignmentItem}
                                >
                                  {assignment.subject || "-"} (Class{" "}
                                  {assignment.class || "-"}
                                  {assignment.section
                                    ? `-${assignment.section}`
                                    : ""}
                                  )
                                </div>
                              ))
                            : "-"}
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.editButton}
                        onClick={() => handleEditClick(teacher)}
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => handleDeleteClick(teacher)}
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
        <EditTeacherModal
          teacher={selectedTeacher}
          onClose={handleCloseModal}
        />
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.deleteModalContent}>
            <div className={styles.deleteModalHeader}>
              <Trash2 size={24} className={styles.deleteIcon} />
              <h2>Delete Teacher</h2>
            </div>

            <div className={styles.deleteModalBody}>
              <p>
                Are you sure you want to delete{" "}
                <strong>{selectedTeacher?.name}</strong>? This action cannot be
                undone.
              </p>
              {selectedTeacher?.assignments?.length > 0 && (
                <div className={styles.warningNote}>
                  <p>This will also remove all their class assignments.</p>
                </div>
              )}
            </div>

            <div className={styles.deleteModalFooter}>
              <button
                onClick={handleCloseModal}
                className={styles.cancelDeleteButton}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
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

export default Teachers
