const express = require("express")
const app = express();
const request = require("request");
const CircuitBreaker = require('opossum');
const options = {
    timeout: 7000, // If our function takes longer than 3 seconds, trigger a failure
    errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit
    resetTimeout: 30000  // After 30 seconds, try again.
};

const getSVCQuote_Offer = function (req, res) {

    return new Promise((resolve, reject) => {
        let queryParams = req.body.data
        let baseUrl = `http://www.offerlogix.net/quote/SVCQuote_Offer.php?${querystring.stringify(queryParams)}`
        var options = {
            url: baseUrl,
            method: 'GET',
            //timeout: 45000
        };
        request.get(options, function (error, response, body) {
            if (response) {
                resolve(response)
            }
            if (error) {
                reject(error)
            }
        })

    });


}
const getSVCQuote_OfferBreaker = new CircuitBreaker(getSVCQuote_Offer, options);

const getSVCQuote_Offers = async (req, res) => {
    try {



        getSVCQuote_OfferBreaker.fire(req, res)
            .then((result) => {
                console.log('get SVCQuote_Offer Breaker  is fireed successed.')
                res.send(result.body)

            }) // logs 'foo'
            .catch(err => {
                this.logger.error('get SVCQuote_Offer Breaker  is fireed failed.')
                res.send({
                    status: false,
                    error: 'Sorry, out of service right now'
                })
            });


        getSVCQuote_OfferBreaker.fallback(() => {
            console.log('get SVCQuote_Offer Breaker Connection is fallback.')
            res.send({
                status: false,
                error: 'Sorry, out of service right now'
            })
        });
        getSVCQuote_OfferBreaker.on('timeout',
            (result) => {
                console.log('get SVCQuote_Offer Breaker Connection is timeout.')
                res.send({
                    status: false,
                    error: 'Sorry, Connection TimeOUt..'
                })
            });

        getSVCQuote_OfferBreaker.on('success',
            (result) => {
                console.log('get SVCQuote_Offer Breaker Connection is successed.')
            });
        getSVCQuote_OfferBreaker.on('reject',
            (result) => {
                console.log('get SVCQuote_Offer Breaker Connection is rejected.')
                res.send({
                    status: false,
                    error: 'Sorry, Connection is rejected.'
                })
            });

        getSVCQuote_OfferBreaker.on('open',
            (result) => {
                console.log('get SVCQuote_Offer Breaker Connection is Open.')
                res.send({
                    status: false,
                    error: 'Sorry, Connection is open now.'
                })
            });

        getSVCQuote_OfferBreaker.on('halfOpen',
            (result) => { console.log('get SVCQuote_Offer Breaker Connection is halfOpen.') });

        getSVCQuote_OfferBreaker.on('close',
            () => console.log('get SVCQuote_Offer Breaker Connection is cloed.'));




    } catch (error) {
        console.log(`Failed to get SVC Quote_Offer on Circuit Breaker  ${JSON.stringify(error, null, 2)}`);
        return {
            status: false,
            error: error
        }
    }
}
app.post(
    '/Test/SVCQuote_Offer',
    getSVCQuote_Offers.bind(this)
);
app.listen(5000, () => {
    console.log("Server is running on port..5000")
})

