/*global
window, SpeechSynthesisUtterance
*/
/**
 * @property {object} speechSynthesisInstance - The speech synthesis instance.
 * @property {array} languages - The list of availables languages for the browser.
 * @property {string} selectedLang - The selected language.
 * @property {array} voices - The list of availables voices for the browser.
 * @property {array} filteredVoices - The list of voices that correspond to the selected language.
 * @property {object} selectedVoice - The selected voice.
 * @property {object} pitch - The pitch object with the selected, minimum and maximum values.
 * @property {object} rate - The rate object with the selected, minimum and maximum values.
 * @property {boolean} utterancePaused - The pause state for utterance being spoked.
 */
var speechSynthesisInstance = null;
var languages = [];
var selectedLang = null;
var voices = [];
var filteredVoices = [];
var selectedVoice = null;
var pitch = {
    minimum: 0,
    maximum: 2,
    selected: 1
};
var rate = {
    minimum: 0,
    maximum: 10,
    selected: 1
};
var utterancePaused = false;
//var utterances = [];

/**
* Set the feedback text and type.
* @function setFeedback
* @param {string} message - The text that will be displayed in the feedback box.
* @param {string} [type] - The style of the feedback box.
*/
function setFeedback(message, type) {
    'use strict';
    var feedbackText = document.getElementById('feedbackText');
    feedbackText.innerHTML = message;
    if (type) {
        feedbackText.parentElement.className += ' ' + type;
    } else {
        feedbackText.parentElement.className = 'feedback';
    }
}

/**
* Trigger an event for the given element.
* @function dispatchEvent
* @param {string} event - The name of the event that is triggered.
* @param {node} element - The DOM element for which the event is triggered.
*/
function dispatchEvent(event, element) {
    'use strict';
    if (document.createEvent !== undefined) {
        var evt = document.createEvent('HTMLEvents');
        evt.initEvent(event, false, true);
        element.dispatchEvent(evt);
    } else {
        element.fireEvent('on' + event);
    }
}

/**
* Set the option list for a select.
* @function populateDropDown
* @param {node} element - The DOM select element that is populated.
* @param {object} options - The list of options that will be inserted in the DOM select element.
* @param {object} attributes - The fields containing text and value for the options.
*/
function populateDropDown(element, options, attributes) {
    'use strict';
    var l = element.length;
    var i;
    for (i = l; i >= 0; i -= 1) {
        element.remove(i);
    }
    var option = null;
    l = options.length;
    for (i = 0; i < l; i += 1) {
        option = document.createElement('option');
        option.text = options[i][attributes.text];
        if (attributes.value === 'index') {
            option.value = i;
        } else {
            option.value = options[i][attributes.value];
        }
        element.add(option);
    }
}

/**
* Set the option list for the language.
* @function showAvailableLanguages
*/
function showAvailableLanguages() {
    'use strict';
    languages = [];
    var vl = voices.length;
    var ll = languages.length;
    var flag = true;
    var i;
    var j;
    for (i = 0; i < vl; i += 1) {
        for (j = 0; j < ll; j += 1) {
            if (languages[j].name === voices[i].lang) {
                flag = false;
                break;
            }
        }
        if (flag) {
            languages.push({
                name: voices[i].lang
            });
            ll += 1;
        }
        flag = true;
    }
    var domSelectedLang = document.getElementById('selectedLang');
    populateDropDown(domSelectedLang, languages, {
        text: 'name',
        value: 'index'
    });
    dispatchEvent('change', domSelectedLang);
}

/**
* Get the voice list for the browser.
* @function getVoiceList
*/
function getVoiceList() {
    'use strict';
    voices = speechSynthesisInstance.getVoices();
    if (voices.length) {
        showAvailableLanguages();
    } else {
        setFeedback('No voices were found.');
    }
}

/**
* Set the function to be executed on getting the voice list.
* @function checkOnVoicesChanged
*/
function checkOnVoicesChanged() {
    'use strict';
    speechSynthesisInstance = window.speechSynthesis;
    getVoiceList();
    if (speechSynthesisInstance.onvoiceschanged !== undefined) {
        speechSynthesisInstance.onvoiceschanged = getVoiceList;
    } else {
        setFeedback('Voice list changed.');
    }
}

/**
* Check if the speech synthesis object is present on the browser.
* @function checkSpeechSynthesis
*/
function checkSpeechSynthesis() {
    'use strict';
    if (window.speechSynthesis !== undefined) {
        checkOnVoicesChanged();
    } else {
        setFeedback('SpeechSynthesis API is not available in your browser.', 'error');
    }
}

if (navigator.onLine) {
    checkSpeechSynthesis();
} else {
    setFeedback('You are not connected to internet.', 'error');
}

/**
* Filter the voice list that match with the selected language.
* @function filterVoices
* @param {object} voice - The voice to be compared with the selected language.
* @returns {boolean} Comparition beetwen voice language and selected language.
*/
function filterVoices(voice) {
    'use strict';
    if (selectedLang) {
        var voiceLangs = voice.lang.split('-');
        var splitedLang = selectedLang.name.split('-');
        return voiceLangs[0] === splitedLang[0];
    }
}

/**
* Set the option list for the voices.
* @function showAvailableVoices
*/
function showAvailableVoices() {
    'use strict';
    var domSelectedVoice = document.getElementById('selectedVoice');
    filteredVoices = voices.filter(filterVoices);
    populateDropDown(domSelectedVoice, filteredVoices, {
        text: 'name',
        value: 'index'
    });
    dispatchEvent('change', domSelectedVoice);
}

document.getElementById('selectedLang').addEventListener('change', function () {
    'use strict';
    selectedLang = languages[this.value];
    setFeedback('Selected language: ' + selectedLang.name + '.');
    showAvailableVoices();
});

document.getElementById('selectedVoice').addEventListener('change', function () {
    'use strict';
    selectedVoice = filteredVoices[this.value];
    setFeedback('Selected voice: ' + selectedVoice.name + '.');
});

document.getElementById('selectedPitch').addEventListener('change', function () {
    'use strict';
    pitch.selected = this.value;
});

document.getElementById('selectedRate').addEventListener('change', function () {
    'use strict';
    rate.selected = this.value;
});

/**
* Create an utterance and set their properties.
* @function setUtterance
* @param {string} text - The text to be spoken.
* @returns {object} The constructed utterance.
*/
function setUtterance(text) {
    'use strict';
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedVoice.lang;
    utterance.pitch = pitch.selected;
    utterance.rate = rate.selected;
    utterance.voice = selectedVoice;

    utterance.onstart = function () {
        document.getElementById('speak').innerHTML = 'Pause';
        setFeedback('Utterance speak started.');
    };
    utterance.onpause = function () {
        utterancePaused = true;
        document.getElementById('speak').innerHTML = 'Speak';
        setFeedback('Utterance speak paused.');
    };
    utterance.onresume = function () {
        utterancePaused = false;
        document.getElementById('speak').innerHTML = 'Pause';
        setFeedback('Utterance speak resumed.');
    };
    utterance.onend = function () {
        utterancePaused = false;
        document.getElementById('speak').innerHTML = 'Speak';
        setFeedback('Utterance speak ended.');
    };
    utterance.onerror = function () {
        setFeedback('An error has ocurred triying to speak.');
    };

    return utterance;
}

/**
* Add the utterance to the speak queue.
* @function speakUtterance
*/
function speakUtterance() {
    'use strict';
    var utterance = setUtterance(document.getElementById('textToSpeak').innerHTML);
    speechSynthesisInstance.speak(utterance);
}

/**
* Play, pause or resume the speak of the utterance queue.
* @function speak
*/
function speak() {
    'use strict';
    if (speechSynthesisInstance.speaking) {
        if (utterancePaused) {
            speechSynthesisInstance.resume();
        } else {
            speechSynthesisInstance.pause();
        }
    } else {
        if (selectedVoice) {
            speakUtterance();
        } else {
            setFeedback('Select a voice first.', 'warning');
        }
    }
}

document.getElementById('speak').addEventListener('click', function (event) {
    'use strict';
    event.preventDefault();
    speak();
});

document.getElementById('stop').addEventListener('click', function () {
    'use strict';
    speechSynthesisInstance.cancel();
    setFeedback('Speech stoped.');
});

/**
* Set the document language as the selected language.
* @function setDocLanguage
*/
function setDocLanguage() {
    'use strict';
    var domSelectedLang = document.getElementById('selectedLang');
    var docLang = document.documentElement.lang;
    if (docLang) {
        var l = languages.length;
        var i;
        for (i = 0; i < l; i += 1) {
            if (languages[i].name === docLang) {
                selectedLang = docLang;
                domSelectedLang.selectedIndex = i;
                dispatchEvent('change', domSelectedLang);
                break;
            }
        }
    }
}

/**
* Append or prepend a text to a given utterance original text.
* @function addUtteranceText
* @param {object} utterance - The utterance to be modified.
* @param {string} position - The position of the text to be added to the utterance's original text.
* @param {string} text - The text to be added to the utterance's original text.
* @returns {object} The modified utterance.
*/
function addUtteranceText(utterance, position, text) {
    'use strict';
    if (position === 'pre') {
        utterance.text = text + ' ' + utterance.text;
    } else {
        utterance.text += ' ' + text;
    }
    return utterance;
}