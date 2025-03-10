$(document).ready(function () {
    $('#over').DataTable({
        ajax: async function (data, callback, settings) {
            try {
                const json = await listTrainings("over");
                if (Array.isArray(json)) {
                    callback({
                        data: json,
                    });
                } else {
                    console.error('Datos no válidos:', json);
                    callback({
                        data: [],
                    });
                }
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                callback({
                    data: [],
                });
            }
        },
        searching: false,
        ordering: false,
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'date', title: 'Fecha (MM-DD-YYYY)' },
            { data: 'total_enrollments', title: 'Inscritos' },
            {
                title: 'Acciones',
                render: function (data, type, row) {
                    return '<button class="btn btn-primary" onclick="handleButtonClick(' + row.id + ')">Ver Detalles</button>';
                }
            },
        ]
    });
});

$(document).ready(function () {
    $('#scheduled').DataTable({
        ajax: async function (data, callback, settings) {
            try {
                const json = await listTrainings("scheduled");
                if (Array.isArray(json)) {
                    callback({
                        data: json,
                    });
                } else {
                    console.error('Datos no válidos:', json);
                    callback({
                        data: [],
                    });
                }
            } catch (error) {
                console.error('Error al obtener los datos:', error);
                callback({
                    data: [],
                });
            }
        },
        searching: false,
        ordering: false,
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'date', title: 'Fecha (MM-DD-YYYY)' },
            { data: 'total_enrollments', title: 'Inscritos' },
            {
                title: 'Acciones',
                render: function (data, type, row) {
                    return '<button class="btn btn-primary" onclick="handleButtonClick(' + row.id + ', \'' + row.date + '\')">Ver Detalles</button>';
                },
            }
        ]
    });
});

async function handleButtonClick(id, trainingDate) {
    const today = dayjs();
    const dated = dayjs(trainingDate, 'MM-DD-YYYY').set('hour', 11).set('minute', 0).set('second', 0);
    const formatedDated = dated?.format("MM-DD-YYYY");
    const toBackDate = dated?.format("YYYY-MM-DD");
    if (id === 0) return;
    if ($.fn.DataTable.isDataTable('#training-datails')) {
        $('#training-datails').DataTable().destroy();
    }
    $('#training-datails').DataTable({
        ajax: async function (data, callback, settings) {
            try {
                const response = await fetch(`http://localhost/cim-training-backend/training-api.php`, {
                    method: "POST",
                    body: JSON.stringify({
                        api: "trainings_participants",
                        id_training: id?.toString(),
                    }),
                });
                if (!response.ok) {
                    throw new Error('Error al obtener los detalles');
                }
                const data = await response?.json();
                if (Array.isArray(data)) {
                    callback({ data });
                } else {
                    callback({ data: [] });
                }
            } catch (error) {
                callback({ data: [] });
            } finally {
                const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
                modal.show();
            }
        },
        searching: false,
        ordering: false,
        columns: [
            { data: 'id_training', title: 'ID' },
            { data: 'fullname', title: 'Nombre' },
            { data: 'email', title: 'Email' },
            { data: 'phone_number', title: 'Teléfono' },
            {
                title: 'Acciones',
                render: function (data, type, row) {
                    const { email, fullname, platform } = row;
                    if (today.isAfter(formatedDated)) {
                        return `<button class="btn btn-${row?.attended === 1 ? 'success" disabled' : 'primary"'} onclick="handleVerifyAttendClick(${row?.id_training}, ${row?.id_participant}, ${dated?.format("YYYY-MM-DD")?.toString()})">${row?.attended === 1 ? "Asistió" : "Asistencia"}</button>`;
                    } else {
                        return '<button class="btn btn-primary" onclick="handleResendEmailClick(\'' + fullname + '\', \'' + email + '\', \'' + toBackDate + '\', \'' + platform + '\')">Reenviar invitación</button>';
                    }
                },
            }
        ],
        columnDefs: [
            {
                targets: 0,
                visible: false
            }
        ]
    });
}

const handleOpenModal = () => {
    const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
}

const handleCloseModal = () => {
    const modal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
    if (modal) {
        modal.hide();
    } else {
        console.error('Modal instance not found');
    }
};

const handleResendEmailClick = async (fullname, email, date, platform) => {
    try {
        const day = dayjs(date).day();
        Swal.fire({
            title: "Reenviando la invitación",
            timerProgressBar: true,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCloseButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });
        const response = await fetch("http://localhost/cim-training-backend/training-api.php", {
            method: "POST",
            body: JSON.stringify({
                api: "resend_email",
                email: email,
                fullname: fullname,
                date: date,
                day: day,
                platform: platform,
            }),
        });
        if (!response.ok) {
            console.error("Error al consumir");
            Swal.fire({
                title: 'Error!',
                text: 'Hubo un problema al reenviar la invitación.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        const json = await response?.json();
        Swal.fire({
            title: 'Enviada!',
            text: 'Invitación reenviada correctamente.',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    } catch (error) {
        Swal.fire({
            title: 'Error!',
            text: 'Hubo un problema al reenviar la invitación.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }
}

const handleVerifyAttendClick = async (idTraining, idUser, date) => {
    console.log({ idUser, idTraining });
    try {
        const response = await fetch('http://localhost/cim-training-backend/training-api.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                training_id: idTraining,
                participant_id: idUser,
            }),
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        handleCloseModal();
        handleButtonClick(idTraining, date);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

async function listTrainings(type = "over") {
    const results = await fetch('http://localhost/cim-training-backend/training-api.php', {
        method: "POST",
        body: JSON.stringify({
            api: "trainings"
        }),
    });
    const json = await results?.json();
    if (!json || !Array.isArray(json) || json?.length === 0) return [];
    const now = dayjs();
    const filtered = json.filter(entry => {
        const elementDate = dayjs(entry.date);
        if (type === "over") {
            return elementDate.isBefore(now);
        } else {
            return elementDate.isAfter(now);
        }
    });
    const mapped = filtered?.map(element => {
        const newDate = dayjs(element?.date)?.format("MM-DD-YYYY");
        return {
            ...element,
            date: newDate,
        };
    })
    return mapped;
}