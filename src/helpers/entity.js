import requests from "./requests";

const UNDEFINED = "[НЕОПРЕДЕЛЕНО]";
export default {
    // Основная информация о сущности
    mainSummary (subject, summary) {
        summary.push({
            title: 'Идентификатор',
            content: subject.id
        });

        summary.push({
            title: 'Наименование',
            content: subject.title || UNDEFINED
        });

        subject.locations && subject.locations.map((location) => {
            summary.push({
                title: 'Размещение',
                content: location,
                link: location
            });
        });
    },

    // Выявляем технологии сущности
    technologySummary (subject, summary) {
        let technologies = {};
        subject.technologies && subject.technologies.map((technology) => (technologies[technology] = {}));
        // Если в объекте технологии не заявлены, выясняем из по проектам расположения
        if ((Object.keys(technologies).length === 0) && subject.locations) {
            subject.locations.map((location) => {
                const projectID = requests.getGitLabProjectID(location);
                const project = window.Vuex.state.projects[projectID || '*'];
                if (!project) return;
                technologies = Object.assign(technologies, project.languages);
            });
        }
        const content = [];

        // Добываем больше сведений о технологиях
        Object.keys(technologies).map((techID) => {
            const technology = window.Vuex.state.technologies.items[techID];
            if (technology && technology.link) {
                content.push(`<a href="${technology.link}" title="${technology.title || techID}">${techID}</a>`);
            } else
                content.push(techID);
        });

        content.length > 0 && summary.push({
            title: 'Технологии',
            content: content.join('; ')
        });
    },

    // Формируем карточку сущности
    buildSummary(entity, subjectID) {
        let subject = {};
        let exFields = {};
        switch (entity) {
            case 'aspect':
                subject = window.Vuex.state.aspects[subjectID];
                exFields = window.Vuex.state.fields['aspect']
                break;
            case 'component':
                subject = window.Vuex.state.components[subjectID];
                subject && (exFields = window.Vuex.state.fields[subject.entity]);
                break;
        }

        const result = [];
        this.mainSummary(subject || { id : subjectID}, result);
        if (subject) {
            this.technologySummary(subject, result);
        }

        if (exFields) {
            for (const fieldID in exFields) {
                const field = exFields[fieldID];
                if (subject[fieldID] || field.required) {
                    result.push({
                        title: exFields[fieldID].title,
                        content: subject[fieldID] || UNDEFINED
                    });
                }
            }
        }
        return result;
    }
};
