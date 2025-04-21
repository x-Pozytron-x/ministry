//--- Page publishers ---//



function settings () {
  if (typeof window.dbData === 'undefined') {
     congregationName = "Enter congregation Name";
  } else {
    congregationName = dbData.tbl_settings['congregationName'];
  }


  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("settings"); 
  _component.innerHTML = `
    <h2>Settings</h2>
    <input type="text" id="congregationName" value="${congregationName}">
    
    <button id="set_congregationName">Set congregation Name</button>
  `;

  

  return _component;


}; 