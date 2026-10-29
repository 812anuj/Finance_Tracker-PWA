$(document).ready(function () {
    const modalOne = document.querySelector('#incomeModal'),
    modalTwo = document.querySelector('#expenseModal'),
    modalOneToggler = document.querySelector('.toggle-modal-one'),
    modalTwoToggler = document.querySelector('.toggle-modal-two'),
    modalThreeToggler = document.querySelector('.toggle-modal-three'),
    incomeSubmitBtn = document.querySelector('.modal-one-submit'),
    expenseSubmitBtn = document.querySelector('.modal-two-submit'),
    categorySubmitBtn = document.querySelector('.modal-three-submit'),
    seeMoreBtns = document.querySelectorAll('.see-more'),
    removeBtns = document.querySelectorAll('.fa-square-minus'),
    incomeForm = document.querySelector('.income-form'),
    expenseForm = document.querySelector('.expense-form'),
    categoryForm = document.querySelector('.category-form'),
    records = document.querySelectorAll('.record'),
    updateForm = document.querySelector('.update-form'),
    updateSubmitBtn = document.querySelector('.modal-four-submit'),
    logoutBtn = document.querySelector('.logout');

    const body = document.querySelector('body');

    window.addEventListener('offline', () => {
        console.log('You are now offline!')
    })

    window.addEventListener('online', () => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.sync.register('sync-offline-data');
            })
        }
    })

    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', event => {
            window.location.reload();
        })
    }

    function captureFormData(gotForm) {
        const formData = new FormData(gotForm);

        const data = {};

        formData.forEach((value, key) => {
            data[key] = value;
        })

        data['target'] = gotForm.id;

        return data;
    }

    function openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('offlineDataStore', 1);

            request.onsuccess = function (event) {
                const db = event.target.result;

                resolve(db);
            }

            request.onerror = function (event) {
                reject(event.target.error);
            }

            request.onupgradeneeded = function (event) {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('data')) {
                    const store = db.createObjectStore('data', {keyPath: 'id', autoIncrement: true});

                    store.createIndex('targetIndex', 'target', {unique: false});
                }
            }
        })
    }

    function storeDataOffline(data) {
        openDatabase().then((db) => {
            const transaction = db.transaction('data', 'readwrite');

            const store = transaction.objectStore('data');

            store.add(data);

            transaction.oncomplete = function () {
                console.log('Data Stored Offline!');
            }

            transaction.onerror = function () {
                console.log('Error Storing Data Offline!');
            }
        }).catch((error) => {
            console.error('Failed to open database:', error);
        })
    }

    function getCSRFToken() {
        var cookieValue = null;

        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');

            for (var i=0; i<cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);

                if (cookie.substring(0, 10) == ('csrftoken' + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(10));

                    break;
                }
            }
        }

        return cookieValue;
    }

    var csrfToken = getCSRFToken();

    modalOneToggler.addEventListener('click', (event) => {
        body.style.marginRight = '0';
        body.style.paddingRight = '0';
    })

    modalTwoToggler.addEventListener('click', (event) => {
        body.style.marginRight = '0';
        body.style.paddingRight = '0';
    })

    modalThreeToggler.addEventListener('click', (event) => {
        body.style.marginRight = '0';
        body.style.paddingRight = '0';
    })

    incomeSubmitBtn.addEventListener('click', async (event) => {

        if (navigator.onLine === false) {
            storeDataOffline(captureFormData(incomeForm));

            const closeBtn = modalOne.closest('.modal').querySelector('.btn-close');

            closeBtn.click();

        } else {
            const formData = new FormData(incomeForm);

            try {
                const response = await fetch('/income/create/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                    body: formData,
                })

                if (response.ok) {
                    window.location.href = window.location.origin + '/dashboard/';
                }
            } catch (error) {
                console.error('Error submitting form: ', error);
            }
        }
        
    })

    expenseSubmitBtn.addEventListener('click', async (event) => {
        if (navigator.onLine === false) {
            storeDataOffline(captureFormData(expenseForm));

            const closeBtn = modalOne.closest('.modal').querySelector('.btn-close');

            closeBtn.click();

        } else {
            const formData = new FormData(expenseForm);

            try {
                const response = await fetch('/expense/create/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': csrfToken,
                    },
                    body: formData,
                })

                if (response.ok) {
                    window.location.href = window.location.origin + '/dashboard/';
                }
            } catch (error) {
                console.error('Error submitting form: ', error);
            }
        }
    })

    categorySubmitBtn.addEventListener('click', (event) => {
        event.preventDefault();

        categoryForm.submit();
    })

    seeMoreBtns.forEach(seeMoreBtn => {
        seeMoreBtn.addEventListener('click', (event) => {
            event.preventDefault();

            if (seeMoreBtn.getAttribute('class').includes('income-see-more')) {
                document.querySelectorAll('.income-data').forEach(income => income.classList.remove('no-see'));

            } else if (seeMoreBtn.getAttribute('class').includes('expense-see-more')) {
                document.querySelectorAll('.expense-data').forEach(expense => expense.classList.remove('no-see'));
                
            } else if (seeMoreBtn.getAttribute('class').includes('category-see-more')) {
                document.querySelectorAll('.category-data').forEach(category => category.classList.remove('no-see'));
                
            }
        })
    })

    removeBtns.forEach(removeBtn => {
        removeBtn.addEventListener('click', (event) => {
            event.preventDefault();

            const parentDiv = removeBtn.closest('div');

            const parentDivData = parentDiv.getAttribute('id').split('-');

            if (parentDivData[0] == 'cat') {
                actionUrl = window.location.origin + '/category/delete/' + parentDivData[1] + '/'
            } else if (parentDivData[0] == 'inc') {
                actionUrl = window.location.origin + '/income/delete/' + parentDivData[1] + '/'
            } else if (parentDivData[0] == 'exp') {
                actionUrl = window.location.origin + '/expense/delete/' + parentDivData[1] + '/'
            }

            $.ajax({
                url: actionUrl,
                headers: {'X-CSRFToken': csrfToken},
                type: 'DELETE',
                contentType: false,
                dataType: 'json',
                success: function(data) {
                    var response = JSON.parse(JSON.stringify(data));

                    if (response['success']) {
                        window.location.href = window.location.origin + '/dashboard/';
                    }
                },
                error: function(errMsg) {
                    console.log(JSON.stringify(errMsg));
                }
            })
        })
    })

    records.forEach(record => {
        record.addEventListener('click', (event) => {
            body.style.marginRight = '0';
            body.style.paddingRight = '0';

            const targetData = event.target.id.split('-');

            updateForm.action = window.location.origin + '/dashboard/update/' + targetData[0] + '/' + targetData[1] + '/';

            const recordParent = record.closest('tr');

            const amount = recordParent.querySelector('.record-amount').innerText;
            const category = recordParent.querySelector('.record-category-name').innerText;
            const description = recordParent.querySelector('.record-description').innerText;

            updateForm.elements['amount'].value = amount.split('$')[1];

            categoryOptions = updateForm.elements['category'].options;

            for (i=1; i<categoryOptions.length; i++) {
                if (categoryOptions[i].innerText === category) {
                    updateForm.elements['category'].value = categoryOptions[i].value;

                    break;
                }
            }

            updateForm.elements['description'].value = description;
        })
    })

    updateSubmitBtn.addEventListener('click', (event) => {
        event.preventDefault();

        updateForm.submit();
    })
});