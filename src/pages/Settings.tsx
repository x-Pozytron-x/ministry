export const Settings = () => {

  const getSettings = JSON.parse(localStorage.getItem("tbl_settings") || '""');
  let cgname: string = "";
  console.log(getSettings)
  if (getSettings) {
    cgname = getSettings.congregationName
  }
  return (
    <>
      <h1>Settings</h1>
      <h2>{cgname}</h2>
    </>

  )
}