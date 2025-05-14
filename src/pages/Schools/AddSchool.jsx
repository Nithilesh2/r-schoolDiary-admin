import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { firestore } from "../../firebase/firebaseConfig"
import Sidebar from "../../components/Sidebar"
import styles from "./styles/AddSchool.module.css"
import { logActivity } from "../../utils/logActivity"
import { ClipLoader } from "react-spinners"

const AddSchool = () => {
  const [form, setForm] = useState({
    name: "",
    shortName: "",
    principal: "",
    email: "",
    phone: "",
    address: "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await addDoc(collection(firestore, "schools"), form)
      await logActivity(`New school '${form.name}' enrolled`, "Admin")
      alert("School added successfully!")
      setForm({
        name: "",
        shortName: "",
        principal: "",
        email: "",
        phone: "",
        address: "",
      })
      setLoading(false)
    } catch (error) {
      console.error("Error adding school:", error)
      alert("Failed to add school.")
    } finally {
      setLoading(false)
    }
  }

  const resetClicked = () => {
    setForm({
      name: "",
      shortName: "",
      principal: "",
      email: "",
      phone: "",
      address: "",
    })
  }

  return (
    <div className={styles.adminLayout}>
      <Sidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <h1>Add New School</h1>
          </div>

          <div className={styles.formCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">School Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter school name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="shortName">School Short Name</label>
                  <input
                    type="text"
                    id="shortName"
                    name="shortName"
                    value={form.shortName}
                    onChange={handleChange}
                    placeholder="Enter school short name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="principal">Principal Name</label>
                  <input
                    type="text"
                    id="principal"
                    name="principal"
                    value={form.principal}
                    onChange={handleChange}
                    placeholder="Enter principal name"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Principal's Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Principal's Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter full address"
                    required
                  ></textarea>
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={resetClicked}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {loading ? "Adding School..." : "Add School"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddSchool
