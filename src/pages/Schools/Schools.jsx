import { useContext } from "react"
import { Link } from "react-router-dom"
import { Plus, Search, School } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/Schools.module.css"
import { AppContext } from "../../context/AppContext"

const Schools = () => {
  const { search, setSearch, filteredSchools, isOpen } = useContext(AppContext)

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
                <button>Filter</button>
                <button>Export</button>
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
                      <td colSpan="6">No schools found.</td>
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
                        <td>{school.address}</td>
                        <td>
                          <button className={styles.editButton}>Edit</button>
                          <button className={styles.deleteButton}>
                            Delete
                          </button>
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
                          <School size={18} />
                        </div>
                        <div>
                          <h3>{school.name}</h3>
                          <p className={styles.principal}>
                            <span>Principal: </span>
                            <span>{school.principal || "No principal"}</span>
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
                        <span>{school.address || "-"}</span>
                      </div>
                    </div>
                    <div className={styles.cardActions}>
                      <button className={styles.editButton}>Edit</button>
                      <button className={styles.deleteButton}>Delete</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Schools
