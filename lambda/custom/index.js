/**
    Copyright 2017 Amazon.com, Inc. and its affiliates. All Rights Reserved.
    Licensed under the Amazon Software License (the "License").
    You may not use this file except in compliance with the License.
    A copy of the License is located at
      http://aws.amazon.com/asl/
    or in the "license" file accompanying this file. This file is distributed
    on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express 
    or implied. See the License for the specific language governing
    permissions and limitations under the License.
    
    This skill demonstrates how to use Dialog Management to delegate slot 
    elicitation to Alexa. For more information on Dialog Directives see the
    documentation: https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html

    This skill also uses entity resolution to define synonyms. Combined with 
    dialog management, the skill can ask the user for clarification of a synonym
    is mapped to two slot values.
 **/


'use strict';
const Alexa = require("alexa-sdk");
const https = require('https');

// For detailed tutorial on how to make an Alexa skill,
// please visit us at http://alexa.design/build

var handlers = {
    'NewSession': function() {
        console.log("in NewSession");
        // when you have a new session,
        // this is where you'll
        // optionally initialize

        // after initializing, continue on
        routeToIntent.call(this);
    },
    'LaunchRequest': function () {
        console.log("in LaunchRequest");
        this.response.speak('Welcome to Job Finder. I will recommend the best job for you. Do you want to start your career or be a couch potato?');
        this.response.listen('Do you want a career or to be a couch potato?');
        this.emit(':responseReady');
    },
    'CouchPotatoIntent' : function() {

        this.response.speak("You don't want to start your career? Have fun wasting away on the couch.");
        this.emit(':responseReady');
    },
    'OccupationMatchIntent' : function () {
        // delegate to Alexa to collect all the required slots
        let isTestingWithSimulator = false; //autofill slots when using simulator, dialog management is only supported with a device
        let filledSlots = delegateSlotCollection.call(this, isTestingWithSimulator);

        if (!filledSlots) {
            return;
        }

        console.log("filled slots: " + JSON.stringify(filledSlots));
        // at this point, we know that all required slots are filled.
        let slotValues = getSlotValues(filledSlots);

        console.log(JSON.stringify(slotValues));

        let key = `${slotValues.richness.resolved}-${slotValues.personality.resolved}-${slotValues.bloodTolerance.resolved}-${slotValues.affectionTarget.resolved}`;
        let occupation = options[slotsToOptionsMap[key]];

        console.log("look up key: ", key,  "object: ", occupation);

        let speechOutput = 'So you want to be ' + slotValues.richness.resolved +
                           '. You are an ' + slotValues.personality.resolved + 
                           ', you like ' + slotValues.affectionTarget.resolved +
                           '  and you ' + (slotValues.bloodTolerance.resolved === "high" ? 'can' : 'can\'t' ) + 
                           ' tolerate blood ' +
                           '. You should consider being a ' + occupation.name;

        console.log("Speech output: ", speechOutput);
        this.response.speak(speechOutput);
        this.emit(':responseReady');

    },
    'SessionEndedRequest' : function() {
        console.log('Session ended with reason: ' + this.event.request.reason);
    },
    'AMAZON.StopIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'AMAZON.HelpIntent' : function() {
        this.response.speak("This is Job Finder. I can help you find the perfect job. " +
             "You can say, recommend a job.").listen("Would you like a career or do you want to be a couch potato?");
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent' : function() {
        this.response.speak('Bye');
        this.emit(':responseReady');
    },
    'Unhandled' : function() {
        this.response.speak("Sorry, I didn't get that. You can try: 'alexa, tell job finder to" +
            " recommend a job.'");
    }
};

exports.handler = function(event, context) {

    // Each time your lambda function is triggered from your skill,
    // the event's JSON will be logged. Check Cloud Watch to see the event.
    // You can copy the log from Cloud Watch and use it for testing.
    console.log("====================");
    console.log("REQUEST: " + JSON.stringify(event));
    console.log("====================");
    var alexa = Alexa.handler(event, context);

    // Part 3: Task 4
    // alexa.dynamoDBTableName = 'petMatchTable';
    alexa.registerHandlers(handlers);
    alexa.execute();
};


const REQUIRED_SLOTS = [
    'affectionTarget',
    'bloodTolerance',
    'personality',
    'richness'
];

const slotsToOptionsMap = {
    "poor-introvert-low-animals": 20,
    "poor-introvert-low-people": 8,
    "poor-introvert-high-animals": 1,
    "poor-introvert-high-people": 4,
    "poor-extrovert-low-animals": 10,
    "poor-extrovert-low-people": 3,
    "poor-extrovert-high-animals": 11,
    "poor-extrovert-high-people": 13,
    "middle-class-introvert-low-animals": 21,
    "middle-class-introvert-low-people": 6,
    "middle-class-introvert-high-animals": 19,
    "middle-class-introvert-high-people": 14,
    "middle-class-extrovert-low-animals": 2,
    "middle-class-extrovert-low-people": 12,
    "middle-class-extrovert-high-animals": 17,
    "middle-class-extrovert-high-people": 16,
    "rich-introvert-low-animals": 9,
    "rich-introvert-low-people": 15,
    "rich-introvert-high-animals": 17,
    "rich-introvert-high-people": 7,
    "rich-extrovert-low-animals": 17,
    "rich-extrovert-low-people": 0,
    "rich-extrovert-high-animals": 1,
    "rich-extrovert-high-people": 5,
};

const options = [
    {  "name": "Actor", "description": "" },
    {  "name": "Animal Control Worker", "description": "" },
    {  "name": "Animal Shelter Manager", "description": "" },
    {  "name": "Artist", "description": "" },
    {  "name": "Court Reporter", "description": "" },
    {  "name": "Doctor", "description": "" },
    {  "name": "Geoscientist", "description": "" },
    {  "name": "Investment Banker", "description": "" },
    {  "name": "Lighthouse Keeper", "description": "" },
    {  "name": "Marine Ecologist", "description": "" },
    {  "name": "Park Naturalist", "description": "" },
    {  "name": "Pet Groomer", "description": "" },
    {  "name": "Physical Therapist", "description": "" },
    {  "name": "Security Guard", "description": "" },
    {  "name": "Social Media Engineer", "description": "" },
    {  "name": "Software Engineer", "description": "" },
    {  "name": "Teacher", "description": "" },
    {  "name": "Veterinary", "description": "" },
    {  "name": "Veterinary Dentist", "description": "" },
    {  "name": "Zookeeper", "description": "" },
    {  "name": "Zoologist", "description": "" }
]

// This data is for testing purposes.
// When isTestingWithSimulator is set to true
// The slots will be auto loaded with this default data.
// Set isTestingWithSimulator to false to disable to default data
const defaultData = [
    {
        "name": "richness",
        "value": "billionaire",
        "ERCode": "ER_SUCCESS_MATCH",
        "ERValues": [
            { "value": "rich" }
        ]
    },
    {
        "name": "personality",
        "value": "misunderstood",
        "ERCode": "ER_SUCCESS_MATCH",
        "ERValues": [
            { "value": "introvert" },
        ]
    },
    {
        "name": "affectionTarget",
        "value": "kittens",
        "ERCode": "ER_SUCCESS_MATCH",
        "ERValues": [
            { "value": "animals" },
        ]
    },
    {
        "name": "bloodTolerance",
        "value": "barf",
        "ERCode": "ER_SUCCESS_NO_MATCH",
    },
];


// ***********************************
// ** Helper functions from
// ** These should not need to be edited
// ** www.github.com/alexa/alexa-cookbook
// ***********************************

// ***********************************
// ** Route to Intent
// ***********************************

// after doing the logic in new session,
// route to the proper intent

function routeToIntent() {
    
    switch (this.event.request.type) {
        case 'IntentRequest':
            this.emit(this.event.request.intent.name);
            break;
        case 'LaunchRequest':
            this.emit('LaunchRequest');
            break;
        default:
            this.emit('LaunchRequest');
    }
}

// ***********************************
// ** Dialog Management
// ***********************************

function getSlotValues (filledSlots) {
    //given event.request.intent.slots, a slots values object so you have
    //what synonym the person said - .synonym
    //what that resolved to - .resolved
    //and if it's a word that is in your slot values - .isValidated
    let slotValues = {};

    console.log('The filled slots: ' + JSON.stringify(filledSlots));
    Object.keys(filledSlots).forEach(function(item) {
        //console.log("item in filledSlots: "+JSON.stringify(filledSlots[item]));
        var name = filledSlots[item].name;
        //console.log("name: "+name);
        if(filledSlots[item]&&
           filledSlots[item].resolutions &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0] &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0].status &&
           filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code ) {

            switch (filledSlots[item].resolutions.resolutionsPerAuthority[0].status.code) {
                case "ER_SUCCESS_MATCH":
                    slotValues[name] = {
                        "synonym": filledSlots[item].value,
                        "resolved": filledSlots[item].resolutions.resolutionsPerAuthority[0].values[0].value.name,
                        "isValidated": true
                    };
                    break;
                case "ER_SUCCESS_NO_MATCH":
                    slotValues[name] = {
                        "synonym": filledSlots[item].value,
                        "resolved": filledSlots[item].value,
                        "isValidated":false
                    };
                    break;
                }
            } else {
                slotValues[name] = {
                    "synonym": filledSlots[item].value,
                    "resolved": filledSlots[item].value,
                    "isValidated": false
                };
            }
        },this);
        //console.log("slot values: "+JSON.stringify(slotValues));
        return slotValues;
}

// This function delegates multi-turn dialogs to Alexa.
// For more information about dialog directives see the link below.
// https://developer.amazon.com/docs/custom-skills/dialog-interface-reference.html
function delegateSlotCollection(shouldFillSlotsWithTestData) {
    console.log("in delegateSlotCollection");
    console.log("current dialogState: " + this.event.request.dialogState);

    // This will fill any empty slots with canned data provided in defaultData
    // and mark dialogState COMPLETED.
    // USE ONLY FOR TESTING IN THE SIMULATOR.
    if (shouldFillSlotsWithTestData) {
        let filledSlots = fillSlotsWithTestData.call(this, defaultData);
        this.event.request.dialogState = "COMPLETED";
    };

    if (this.event.request.dialogState === "STARTED") {
        console.log("in STARTED");
        console.log(JSON.stringify(this.event));
        var updatedIntent=this.event.request.intent;
        // optionally pre-fill slots: update the intent object with slot values 
        // for which you have defaults, then return Dialog.Delegate with this 
        // updated intent in the updatedIntent property

        disambiguateSlot.call(this);
        console.log("disambiguated: " + JSON.stringify(this.event));
        this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("in not completed");
        //console.log(JSON.stringify(this.event));

        disambiguateSlot.call(this);
        this.emit(":delegate", updatedIntent);
    } else {
        console.log("in completed");
        //console.log("returning: "+ JSON.stringify(this.event.request.intent));
        // Dialog is now complete and all required slots should be filled,
        // so call your normal intent handler.
        return this.event.request.intent.slots;
    }
    return null;
}


// this function will keep any slot values currently in the request
// and will fill other slots with data from testData
function fillSlotsWithTestData(testData) {
    console.log("in fillSlotsWithTestData");

    //console.log("testData: "+JSON.stringify(testData));
    //loop through each item in testData
    testData.forEach(function(item, index, arr) {
        //check to see if the slot exists
        //console.log("item: "+JSON.stringify(item));
        if (!this.event.request.intent.slots[item.name].value) {
            //fill with test data
            //construct the element
            let newSlot = {
                "name": item.name,
                "value": item.value,
                "resolutions": {
                    "resolutionsPerAuthority": [
                        {
                            "authority": "",
                            "status": {
                                "code": item.ERCode,
                            },
                        }
                    ]
                },
                "confirmationStatus": "CONFIRMED"
            };

            //add Entity resolution values
            if (item.ERCode == "ER_SUCCESS_MATCH") {
                let ERValuesArr = [];
                item.ERValues.forEach(function(ERItem){
                    let value = {
                        "value": {
                            "name": ERItem.value,
                            "id": ""
                        }
                    };
                    ERValuesArr.push(value);
                })
                newSlot.resolutions.resolutionsPerAuthority[0].values=ERValuesArr;
            }

            //add the new element to the response
            this.event.request.intent.slots[item.name]=newSlot;
        }
    },this);

    //console.log("leaving fillSlotsWithTestData");
    return this.event.request.intent.slots;
}

// If the user said a synonym that maps to more than one value, we need to ask 
// the user for clarification. Disambiguate slot will loop through all slots and
// elicit confirmation for the first slot it sees that resolves to more than 
// one value.
function disambiguateSlot() {
    let currentIntent = this.event.request.intent;

    Object.keys(this.event.request.intent.slots).forEach(function(slotName) {
        let currentSlot = this.event.request.intent.slots[slotName];
        let slotValue = slotHasValue(this.event.request, currentSlot.name);
        if (currentSlot.confirmationStatus !== 'CONFIRMED' &&
            currentSlot.resolutions &&
            currentSlot.resolutions.resolutionsPerAuthority[0]) {

            if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_MATCH') {
                // if there's more than one value that means we have a synonym that 
                // mapped to more than one value. So we need to ask the user for 
                // clarification. For example if the user said "mini dog", and 
                // "mini" is a synonym for both "small" and "tiny" then ask "Did you
                // want a small or tiny dog?" to get the user to tell you 
                // specifically what type mini dog (small mini or tiny mini).
                if ( currentSlot.resolutions.resolutionsPerAuthority[0].values.length > 1) {
                    let prompt = 'Which would you like';
                    let size = currentSlot.resolutions.resolutionsPerAuthority[0].values.length;
                    currentSlot.resolutions.resolutionsPerAuthority[0].values.forEach(function(element, index, arr) {
                        prompt += ` ${(index == size -1) ? ' or' : ' '} ${element.value.name}`;
                    });

                    prompt += '?';
                    let reprompt = prompt;
                    // In this case we need to disambiguate the value that they 
                    // provided to us because it resolved to more than one thing so 
                    // we build up our prompts and then emit elicitSlot.
                    this.emit(':elicitSlot', currentSlot.name, prompt, reprompt);
                }                
            } else if (currentSlot.resolutions.resolutionsPerAuthority[0].status.code == 'ER_SUCCESS_NO_MATCH') {
                // Here is where you'll want to add instrumentation to your code
                // so you can capture synonyms that you haven't defined.
                console.log("NO MATCH FOR: ", currentSlot.name, " value: ", currentSlot.value);
                
                if (REQUIRED_SLOTS.indexOf(currentSlot.name) > -1) {
                    let prompt = "What " + currentSlot.name + " are you looking for";
                    this.emit(':elicitSlot', currentSlot.name, prompt, prompt);
                }
            }
        }
    }, this);
}

// Given the request an slot name, slotHasValue returns the slot value if one
// was given for `slotName`. Otherwise returns false.
function slotHasValue(request, slotName) {

    let slot = request.intent.slots[slotName];

    //uncomment if you want to see the request
    //console.log("request = "+JSON.stringify(request)); 
    let slotValue;

    //if we have a slot, get the text and store it into speechOutput
    if (slot && slot.value) {
        //we have a value in the slot
        slotValue = slot.value.toLowerCase();
        return slotValue;
    } else {
        //we didn't get a value in the slot.
        return false;
    }
}

// ***********************************
// ** Misc
// ***********************************

function randomPhrase(array) {
    // the argument is an array [] of words or phrases
    var i = 0;
    i = Math.floor(Math.random() * array.length);
    return(array[i]); // If you like one liners this will also do: return(array[Math.floor(Math.random() * array.length)]);
}