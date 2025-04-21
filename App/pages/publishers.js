//--- Page publishers ---//

function get_publishers() {
  
  if (typeof window.dbData === 'undefined') {
    arr_publ = "";
  } else {
    //arr_publ = dbData.tbl_publishers;

    
    
     arr_publ = "<tr>";
    for (const key in dbData.tbl_publishers[0]) {
      arr_publ += `<td>${dbData.tbl_publishers[0][key]}</td>`;
    }
    arr_publ += "</tr>";
    
    // console.log(result);
      
    // const result = `<ul>${Object.entries(person).map(([key, value]) => `<li>${key}: ${value}</li>`).join("")}</ul>`;
    // console.log(result);
    
    
    // arr_publ = `<tr>${dbData.tbl_publishers[0].map(item => `<td>${item}</td>`).join("")}</tr>`;  
  }

  return arr_publ;
}

function publishers () {
  console.log(get_publishers());
  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("publishers"); 
  _component.innerHTML = `
    <h2>Publishers</h2>
    <input type="text" id="publisherName"> <br>
    <input type="text" id="publisherSurname"><br>
    <button>Add publisher</button>

    <table>
      <thead>
        <th>Name</th>
        <th>Surname</th>
        <th>Phone</th>
        <th>Adres</th>
        <th>Birthday</th>
        <th>Baptisted</th>
        <th>&#9892;</th>
        <th>&#128017;</th>
        <th>&#128366;</th>
        <th>&#129309;</th>
        <th>50</th>
        <th>90</th>
        <th>&#127757;</th>
      </thead>
      <tbody>
        ${get_publishers()}
      </tbody>
    </table>
  `;
  return _component;
};