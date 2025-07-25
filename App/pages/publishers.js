//--- Page publishers ---//
function taaabs(){
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab__content');
    
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('tab_active'));
      tabContents.forEach(c => c.classList.remove('tab__content_active'));
      tab.classList.add('tab_active');
      tabContents[index].classList.add('tab__content_active');
    });
  }); 
}

function get_publishers() {
  if (typeof window.dbData === 'undefined') {
    arr_publ = "";
  } else {
    let arr_publishers = db.read('tbl_publishers', {
      sortBy: 'surname',
      ascending: true
    });
     arr_publ = "";

    for (const arr in arr_publishers) {
      arr_publ += "<div data-publisher_id='"+arr_publishers[arr].id+"'>";
      for (const key in arr_publishers[arr]) {
        if (arr_publishers[arr][key] == true ) { 
          arr_publ += `<span>&#9745;</span>`;
        } else if (arr_publishers[arr][key] == false ) {
          arr_publ += `<span>&#9744;</span>`;
        } else if (key != "id") {
          arr_publ += `<span>${arr_publishers[arr][key]}</span>`;
        }
      
      }
      arr_publ += "<i onclick=publisher_delete(this)>&#10060;</i></div>";

    }
  }
  return arr_publ;
}

function publisher_delete (e) {
  console.log(e.parentElement.dataset.publisher_id);
  console.log(dbData.tbl_publishers[e.parentElement.dataset.publisher_id]["name"]);
  db.delete("tbl_publishers", e.parentElement.dataset.publisher_id);
  render_publishers();
}

function render_publishers()  {
  document.getElementById('table_publishers').innerHTML = "";
  document.getElementById('table_publishers').innerHTML = get_publishers();
}

function publisher_add () {
  let publisher = {};
  Object.assign(publisher, {"surname": document.getElementById('publisherSurname').value.trim()});
  Object.assign(publisher, {"name": document.getElementById('publisherName').value.trim()});
  Object.assign(publisher, {"phone": document.getElementById('publisherPhone').value.trim()});
  Object.assign(publisher, {"adres": document.getElementById('publisherAdres').value.trim()});
  Object.assign(publisher, {"birthday": document.getElementById('publisherBirthday').value.trim()});
  Object.assign(publisher, {"baptismday": document.getElementById('publisherBaptised').value.trim()});
  Object.assign(publisher, {"gender": document.getElementById('publisherGender').value.trim()});
  Object.assign(publisher, {"hope": document.getElementById('publisherHope').value.trim()});
  
  Object.assign(publisher, {"isElder": document.getElementById('publisherElder').checked});
  Object.assign(publisher, {"isServant": document.getElementById('publisherServant').checked});
  Object.assign(publisher, {"isPioner": document.getElementById('publisherPioner').checked});
  Object.assign(publisher, {"isSpecial": document.getElementById('publisherSpecial').checked});
  Object.assign(publisher, {"isMissioner": document.getElementById('publisherMissioner').checked});

  Object.assign(publisher, {"id": document.getElementById('publisherMissioner').checked});

  // db.read("tbl_publishers", , {
  //   filter: item => item.isElder
  // });
  //let lastPublisherID = Object.keys(db.tbl_publishers.length)[Object.keys(dbData.tbl_publishers).length].id;

console.log (lastPublisherID)
  //db.create(table, publisher);
  render_publishers();
}

function publishers () {
  //console.log(get_publishers());
  const _component = document.createElement('section');
  _component.classList.add("section");
  _component.classList.add("publishers"); 
  _component.innerHTML = `
    <header class="section__tabs">
      <span class="tab tab_active">Publishers</span>
      <span class="tab">Add</span>
    </header>

    <div class="section__content">


      <div class="tab__content tab__content_active">
        <h2>Publishers</h2>
        <div class="table">
          <div class="thead">
            <span>Surname</span>
            <span>Name</span>
            <span>Phone</span>
            <span>Adres</span>
            <span>Birthday</span>
            <span>Baptisted</span>
            <span>Gender</span>
            <span>&#128017;</span>
            <span>&#128366;</span>
            <span>&#129309;</span>
            <span>50</span>
            <span>90</span>
            <span>&#127757;</span>
            <span>x</span>
          </div>
          <div class="tbody" id="table_publishers">
            ${get_publishers()}
          </div>
        </div>
      </div>

      <div class="tab__content">
        <h2>Add Publisher</h2>
        <label>
          <span>Name</span>
          <input type="text" id="publisherName">
        </label>
        <label>
          <span>Surname</span> 
          <input type="text" id="publisherSurname">
        </label>
        <label>
          <span>Phone</span>
          <input type="number" id="publisherPhone">
        </label>
        <label>
          <span>Adres</span> 
          <input type="text" id="publisherAdres">
        </label>
        <label>
          <span>Birthday</span> 
          <input type="text" id="publisherBirthday">
        </label>
        <label>
          <span>Baptised</span> 
          <input type="text" id="publisherBaptised">
        </label>
        <label>
          <span>Gender</span> 
          <select id="publisherGender">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </label>
        <label>
          <span>Hope</span> 
          <select id="publisherHope">
            <option value="OS">Other sheep</option>
            <option value="SH">Sky Hope</option>
          </select>
        </label>
        <label>
          <span>Elder</span> 
          <input type="checkbox" id="publisherElder">
        </label>
        <label>
          <span>Servant</span> 
          <input type="checkbox" id="publisherServant">
        </label>
        <label>
          <span>Pioner</span> 
          <input type="checkbox" id="publisherPioner">
        </label>
        <label>
          <span>Special</span> 
          <input type="checkbox" id="publisherSpecial">
        </label>
        <label>
          <span>Missioner</span> 
          <input type="checkbox" id="publisherMissioner">
        </label>
        
        <button onclick="publisher_add()">Add publisher</button>
      </div>

    </div>

  `;
  return _component;
};