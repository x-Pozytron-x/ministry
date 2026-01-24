MyApp.pages.publishers = {
  render: function () {
    const container = document.getElementById('content-area');
    if (DB_local.select('tbl_publishers')) {
      container.innerHTML = `

        
        <div class="section__content publishers">
          <div class="tab__content tab__content_active">
            <h2>Publishers <span onclick=document.querySelector('.popup').classList.add('active')> + </span></h2>
            <div class="table">
              <div class="thead">
                <span class="fullname">FullName</span>
                <span class="vps">VPS</span>
                <span class="phone">Phone</span>
                <span class="adres">Adres</span>
                <span class="birthday">Birthday</span>
                <span class="baptismday">Baptisted</span>
                <span class="gender">🚻</span>
                <span class="hope">&#128017;</span>
                <span class="isElder">👨‍🏫</span>
                <span class="isServant">&#129309;</span>
                <span class="isPioner">50</span>
                <span class="isSpecial">90</span>
                <span class="isMissioner">&#127757;</span>
              </div>
              <div class="tbody" id="table_publishers">
                ${get_publishers()}
              </div>
            </div>
          </div>


        </div>


        
          <div class="popup" style="z-index: 99">
            <span class="popup_close" onclick=document.querySelector('.popup').classList.remove('active')>X</span>
            <h2>Add Publisher</h2>
            <section>
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
                <option value="male">🚹</option>
                <option value="female">🚺</option>
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
            </section>
          </div>
      `;


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
    } else {
      container.innerHTML = `please load db`;
    }
  }

}

function popup_add_publisher() {
  console.log('lol')
    ;
}


function get_publishers() {
  if (!DB_local.select('tbl_publishers')) {
    arr_publ = "";
  } else {
    let arr_publishers = DB_local.select('tbl_publishers');
    arr_publishers = Object.entries(arr_publishers).map(([id, item]) => ({ id: parseInt(id), ...item }));

    arr_publishers.sort((a, b) => {
      const valA = a['surname'] || '';
      const valB = b['surname'] || '';
      return valA.localeCompare(valB) * 1;
    });
    arr_publ = "";
    for (const publisher in arr_publishers) {
      let row = arr_publishers[publisher];

      arr_publ += "<div class='row' data-publisher_id='" + row.id + "'>";

      row.gender = (row.gender == 'male') ? '🚹' : '🚺';
      row.hope = (row.hope == 'OS') ? '🌐' : '☁';
      const isCkd = (check) => check ? '☑' : '☐';

      arr_publ += `
        <span class="fullname">${row.surname} ${row.name}</span>
        <span class="vps">0</span>
        <span class="phone">${row.phone ? row.phone : '-'}</span>
        <span class="adres">${row.adres}</span>
        <span class="birthday">${row.birthday}</span>
        <span class="baptismday">${row.baptismday ? row.baptismday : '-'}</span>
        <span class="gender">${row.gender}</span>
        <span class="hope">${row.hope}</span>
        <span class="isElder">${isCkd(row.isElder)}</span>
        <span class="isServant">${isCkd(row.isServant)}</span>
        <span class="isPioner">${isCkd(row.isPioner)}</span>
        <span class="isSpecial">${isCkd(row.isSpecial)}</span>
        <span class="isMissioner">${isCkd(row.isMissioner)}</span>
      `;


      // for (const key in arr_publishers[arr]) {
      //   if (arr_publishers[arr][key] == true) {
      //     arr_publ += `<span>&#9745;</span>`;
      //   } else if (arr_publishers[arr][key] == false) {
      //     arr_publ += `<span>&#9744;</span>`;
      //   } else if (key != "id") {
      //     if (arr_publishers[arr][key] == 'male') {
      //       arr_publishers[arr][key] = '🚹';
      //     }
      //     if (arr_publishers[arr][key] == 'female') {
      //       arr_publishers[arr][key] = '🚺';
      //     }
      //     arr_publ += `<span>${arr_publishers[arr][key]}</span>`;
      //   }
      // }


      arr_publ += "</div>";
      // <i onclick=publisher_delete(this)>&#10060;</i>
    }
  }
  return arr_publ;
}

function publisher_add() {
  let lastPublisherID = Number(Object.keys(DB_local.select("tbl_publishers"))[Object.keys(DB_local.select("tbl_publishers")).length - 1]) + 1;

  let publisher = {
    [lastPublisherID]: {
      "surname": document.getElementById('publisherSurname').value.trim(),
      "name": document.getElementById('publisherName').value.trim(),
      "phone": document.getElementById('publisherPhone').value.trim(),
      "adres": document.getElementById('publisherAdres').value.trim(),
      "birthday": document.getElementById('publisherBirthday').value.trim(),
      "baptismday": document.getElementById('publisherBaptised').value.trim(), "gender": document.getElementById('publisherGender').value.trim(),
      "hope": document.getElementById('publisherHope').value.trim(),
      "isElder": document.getElementById('publisherElder').checked,
      "isServant": document.getElementById('publisherServant').checked,
      "isPioner": document.getElementById('publisherPioner').checked,
      "isSpecial": document.getElementById('publisherSpecial').checked,
      "isMissioner": document.getElementById('publisherMissioner').checked
    }
  };
  DB_local.insert("tbl_publishers", publisher);
  MyApp.pages.publishers.render();
}

function publisher_delete(e) {
  let id = e.parentElement.dataset.publisher_id;
  DB_local.delete("tbl_publishers", id);
  MyApp.pages.publishers.render();
}

