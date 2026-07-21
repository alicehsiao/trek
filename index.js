const INDEX_URL = "https://trektravel.onrender.com/trips";

const hideDetails = () => {
  $('#alert-container').hide();
  $('#search-container').hide();
  $('#search-results-container').hide();
  $('#trip-details-container').hide();
  $('#trips-container').hide();
  $('#new-trip-container').hide();
  $('#content-container').removeClass("initially-hidden");
};


const reportStatus = (message, status) => {
  $('#alert').removeClass();
  $('#alert').addClass(`alert alert-${status}`);
  $('#status-message').html(message);
  $('#alert-container').show();
};

const reportError = (message, errors) => {
  let content = `<p>${message}</p>`
  content += "<ul>";
  for (const field in errors) {
    for (const problem of errors[field]) {
      content += `<li>${field}: ${problem}</li>`;
    }
  }
  content += "</ul>";
  reportStatus(content, 'warning');
};

const clearForm = (formName) => {
  $(`${formName}`)[0].reset();
};

const readFormData = (formName) => {
  const parsedFormData = {};
  let formData = $(`${formName}`).serializeArray();

  for(let field of formData){
    parsedFormData[`${field.name}`] = field.value;
  }

  return parsedFormData;
};

const parsedTripDetails = (response) => {
  const div = $(`<p><strong>Trip ID</strong>: ${response.data.id}</p>
                <p><strong>Trip Name</strong>: ${response.data.name}</p>
                <p><strong>Continent</strong>: ${response.data.continent}</p>
                <p><strong>Category</strong>: ${response.data.category}</p>
                <p><strong>Weeks</strong>: ${response.data.weeks}</p>
                <p><strong>Cost</strong>: ${response.data.cost}</p>
                <p><strong>Description</strong>: ${response.data.about}</p>`);
  return div;
};

const fillForm = (event) => {
  $(`#trip-form input[name="trip-name"]`).attr("value", `${$(event.target).text()}`);
  $(`#trip-form input[name="id"]`).attr("value", `${$(event.target).data("id")}`);
};

const loadTrips = () => {
  hideDetails();
  $('#trips-container').show();

  const tripList = $('#trips');
  tripList.empty();
  const ul = $('<ul></ul>');

  reportStatus('Loading all trips...', 'info');

  axios.get(INDEX_URL)
    .then((response) => {
      response.data.forEach((trip) => {
        const li = $('<li></li>');
        const a = $(`<a>${trip.name}</a>`);
        a.attr('href', `https://trektravel.onrender.com/trips/${trip.id}`);
        a.data('id', trip.id);
        li.append(a);
        ul.append(li);
      });
      tripList.append(ul);
      reportStatus(`Successfully loaded ${response.data.length} trips.`, 'success');
    })
    .catch((error) => {
      reportStatus(`Encountered an error: ${error}.`, 'warning');
    });
};

const loadTripDetails = (event) => {
  event.preventDefault();
  const url = $(event.target)[0].href;
  $('#trip-details-container').show();

  const tripDetails = $('#trip');
  tripDetails.empty();

  axios.get(url)
    .then((response) => {
      tripDetails.append(parsedTripDetails(response));
      fillForm(event);
      reportStatus(`Successfully loaded ${response.data.name}.`, 'success');
    })
    .catch((error) => {
      reportStatus(`Encountered an error: ${error}.`, 'warning');
    });
};

const createReservation = (event) => {
  event.preventDefault();
  let tripData = readFormData("#trip-form");
  const id = tripData["id"];
  const location = tripData["trip-name"];
  tripData = {
    "name": tripData["name"],
    "email": tripData["email"]
  }
  const url = `https://trektravel.onrender.com/trips/${id}/reservations`;

  axios.post(url, tripData)
    .then(() => {
      reportStatus(`${tripData["name"]}, you successfully reserved the trip: ${location}!`, 'success');
      clearForm("#trip-form");
    })
    .catch((error) => {
      if (error.response && error.response.data && error.response.data.errors) {
        reportError(
          `Encountered an error: ${error.message}`,
          error.response.data.errors
        );
      } else {
        reportStatus(`Encountered an error: ${error.message}`);
      }
    });
};

const createTrip = (event) => {
  event.preventDefault();
  let newTripData = readFormData("#create-form");

  axios.post(INDEX_URL, newTripData)
    .then(() => {
      reportStatus(`You successfully created the trip: ${newTripData["name"]}!`, 'success');
      clearForm("#create-form");
    })
    .catch((error) => {
      if (error.response.data && error.response.data.errors) {
        reportError(
          `Encountered an error: ${error.message}`,
          error.response.data.errors
        );
      } else {
        reportStatus(`Encountered an error: ${error.message}`);
      }
    });
};

const searchTrips = (option) => {
  $('#trip-details-container').hide();
  $('#search-results-container').hide();
  reportStatus('Searching for trips...', 'info');

  const searchData = $(`#${option}-form`).serialize();
  const query = $(`#${option}-form`).serializeArray();
  const searchList = $('#queries');
  searchList.empty();
  const ul = $('<ul></ul>');

  const url = `https://trektravel.onrender.com/trips/${option}?${searchData}`;

  axios.get(url)
    .then((response) => {
      if (response.data !== "") {
        response.data.forEach((trip) => {
          const li = $('<li></li>');
          const a = $(`<a>${trip.name}</a>`);
          a.attr('href', `https://trektravel.onrender.com/trips/${trip.id}`);
          a.data('id', trip.id);
          li.append(a);
          ul.append(li);
        });
        searchList.append(ul);
        reportStatus(`Successfully loaded ${response.data.length} trips.`, 'success');
        $('#search-results-container h4').html(`Search Results [${option}: ${query[0].value}]`);
        $('#search-results-container').show();
      } else {
        reportStatus(`Could not find. Please search again.`, 'warning');
      }
      clearForm(`#${option}-form`);
    })
    .catch((error) => {
      reportStatus(`Could not load. ${error}.`, 'warning');
    });
}

const searchOptions = ["continent", "weeks", "budget"];

$(document).ready(() => {
  hideDetails();
  $('#load').on('click', loadTrips);
  $('#trips').on('click', 'a[href]', loadTripDetails);
  $('#queries').on('click', 'a[href]', loadTripDetails);
  $('#trip-form').on('submit', createReservation);
  $('#build').on('click', () => {
    hideDetails();
    $('#new-trip-container').show();
  })
  $('#create-form').on('submit', createTrip);
  $('#search').on('click', () => {
    hideDetails();
    $('#search-container').show();
  })
  for (let option of searchOptions) {
    $(`#${option}-form`).on('submit', (event) => {
      event.preventDefault();
      searchTrips(option);
    });
  }
});
