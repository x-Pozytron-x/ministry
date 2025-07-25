//--- Page publishers ---//

// App/pages/settings.js
MyApp.pages.settings = {
  render: function () {
    const container = document.getElementById('content-area');
    container.innerHTML = '<h2>Настройки</h2><p>Здесь настройки.</p>';
  }
};


// function settings () {
//   if (typeof window.dbData === 'undefined') {
//      congregationName = "Enter congregation Name";
//   } else {
//     congregationName = dbData.tbl_settings['congregationName'];
//   }


//   const _component = document.createElement('section');
//   _component.classList.add("section");
//   _component.classList.add("settings"); 
//   _component.innerHTML = `
//     <h2>Settings</h2>
//     <input type="text" id="congregationName" value="${congregationName}">
    
//     <button id="set_congregationName">Set congregation Name</button>
//   `;

  

//   return _component;


// }; 