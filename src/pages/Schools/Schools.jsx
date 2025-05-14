import { useContext } from "react"

import { Link } from "react-router-dom"
import { Plus, Search, School } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/Schools.module.css"
import { AppContext } from "../../context/AppContext"

const Schools = () => {
  const { search, setSearch, filteredSchools } = useContext(AppContext)

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
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
              <table>
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
                      <td colSpan="5">No schools found.</td>
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
          </div>
        </main>
      </div>
    </div>
  )
}

export default Schools
