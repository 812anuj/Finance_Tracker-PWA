$(document).ready(function () {
    const signUpBtn = document.querySelector('.sign-up-select'),
    logInBtn = document.querySelector('.login-select'),
    signUpForm = document.querySelector('.registration-form'),
    logInForm = document.querySelector('.login-form');

    $(".toggle-password").click(function () {
        $(this).toggleClass("fa-eye fa-eye-slash");

        if ($(this)[0].id == '#id_password') {
            password_toggle = 'password'
        } else if ($(this)[0].id == '#id_password_1') {
            password_toggle = 'password1'
        } else {
            password_toggle = 'password2'
        }
        
        var myFormPasswordInput = $(this).closest('form')[0].elements[password_toggle];
        
        if (myFormPasswordInput) {
            var input = $(myFormPasswordInput);

            if (input.attr('type') == 'password') {
                input.attr('type', 'text');
            } else {
                input.attr('type', 'password');
            }
        }
    })

    signUpBtn.addEventListener('click', (event) => {
        event.preventDefault()

        if (!signUpBtn.getAttribute('class').includes('active')) {
            signUpBtn.classList.add('active');
            logInBtn.classList.remove('active');

            signUpForm.classList.remove('in-active-form');
            signUpForm.classList.add('active-form');

            logInForm.classList.remove('active-form');
            logInForm.classList.add('in-active-form');
        }
    })

    logInBtn.addEventListener('click', (event) => {
        event.preventDefault()

        if (!logInBtn.getAttribute('class').includes('active')) {
            logInBtn.classList.add('active');
            signUpBtn.classList.remove('active');

            signUpForm.classList.add('in-active-form');
            signUpForm.classList.remove('active-form');

            logInForm.classList.add('active-form');
            logInForm.classList.remove('in-active-form');
        }
    })

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

    signUpForm.addEventListener('submit', (event) => {
        event.preventDefault()

        const data = new FormData(signUpForm);

        $.ajax({
            url: signUpForm.action,
            headers: {'X-CSRFToken': csrfToken},
            method: 'POST',
            data: data,
            contentType: false,
            cache: false,
            processData: false,
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

    logInForm.addEventListener('submit', (event) => {
        event.preventDefault()

        const data = new FormData(logInForm);

        $.ajax({
            url: logInForm.action,
            headers: {'X-CSRFToken': csrfToken},
            method: 'POST',
            data: data,
            contentType: false,
            cache: false,
            processData: false,
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
});