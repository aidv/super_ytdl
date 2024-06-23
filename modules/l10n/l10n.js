module.exports = class SAI_L10N {
    constructor(){
        this.load()
    }

    async load(){
        //try { this.updateFromJSON(fs.readJSONSync(global.sai.paths.roaming + 'l10n.json')) } catch(err) { this.categorized = {} }
        
        var l10n = JSON.parse(await fs.promises.readFile(__dirname + '/l10n.json'))
        this.updateFromJSON(l10n)
        
    }

    /*saveToDisk(){
        try { fs.writeJSONSync(global.sai.paths.roaming + 'l10n.json', this.categorized) } catch(err) { }
    }*/

    updateFromJSON(json){
        this.categorized = json
        //notify all windows
    }

    getForCountry(country){
        var categorized = this.categorized

        if (!categorized) return {}

        var _country = country || 'en'

        var language = this.categorized[_country]

        if (!language) language = this.categorized.en

        return language
    }

    listCountries(country){
        return Object.keys(this.categorized)
    }

    getPhrase(phraseID, fallbackPhrase = '<l10n_error>'){
        var lang = global.sk.country
        if (!this.categorized[lang]) lang = 'en'
        var phrase = fallbackPhrase
        try { phrase = this.categorized[lang][phraseID] || fallbackPhrase } catch(err) { phrase = fallbackPhrase }
        return phrase
    }
}