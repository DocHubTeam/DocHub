const SCHEMA_QUERY = `
(
    $MANIFEST := $;
    $CONTEXT_ID := '{%CONTEXT_ID%}';
    $CONTEXT := $CONTEXT_ID = 'self' ? {"title": "Собственный"} : $lookup($MANIFEST.contexts, $CONTEXT_ID);
    {
        "title": $CONTEXT.title ? $CONTEXT.title : $CONTEXT_ID,
        "id": $CONTEXT_ID,
        "components": [components.$spread().(
            $NAMESPACE_ID := $split($keys()[0], "@")[0];
            $NAMESPACE := $lookup($MANIFEST.namespaces, $NAMESPACE_ID);
            {
                "order": $NAMESPACE_ID & ":" & $keys()[0],
                "id": $keys()[0],
                "title": $.*.title,
                "entity": $.*.entity,
                "namespace": {
                        "id": $NAMESPACE_ID,
                        "title": $NAMESPACE and $NAMESPACE.title ? $NAMESPACE.title : $NAMESPACE_ID
                },
                "contexts": $distinct($.*.presentations.contexts),
                "requires": [$distinct($.*.presentations.requires).(
                    $COMPONENT := $lookup($MANIFEST.components, $.id);
                    $NAMESPACE_ID := $split($.id, "@")[0];
                    $NAMESPACE := $lookup($MANIFEST.namespaces, $NAMESPACE_ID);
                    {
                        "id": $.id,
                        "title": $COMPONENT.title ? $COMPONENT.title : $.title,
                        "entity": $COMPONENT.entity ? $COMPONENT.entity : "component",
                        "namespace": {
                                "id": $NAMESPACE_ID,
                                "title": $NAMESPACE and $NAMESPACE.title ? $NAMESPACE.title : $NAMESPACE_ID
                        }
                    }
                )],
                "aspects": [$.*.aspects.$spread().(
                    $ASPECT := $lookup($MANIFEST.aspects, $);
                    {
                    "id": $,
                    "title": $ASPECT.title ? $ASPECT.title : $
                })]
            }
        )][{%CONDITIONS%}]^(order)[]
    }
)
`;

const MENU_QUERY = `
(
    $MANIFEST := $;
    [
        {
            "title": 'Архитектура',
            "route": 'architect',
            "expand": true,
            "icon": 'home'
        },
        {
            "title": "Контексты",
            "route": 'architect/contexts',
            "icon": 'location_searching'
        },
        {
            "title": "Аспекты",
            "route": 'architect/aspects',
            "icon": 'visibility'
        },
        {
            "title": 'Документы',
            "route": 'docs',
            "expand": true,
            "icon": 'description'
        },
        contexts.$spread().{
            "title": $.*.title,
            "route": 'architect/contexts/' & $keys()[0],
            "location": 'architect/contexts/' & $.*.location,
            "icon": $.*.icon ? $.*.icon : ''
        },
        aspects.$spread().{
            "title": $.*.title,
            "route": 'architect/aspects/' & $keys()[0],
            "location": 'architect/aspects/' & $.*.location,
            "icon": $.*.icon ? $.*.icon : ''
        },
        docs.$spread().{
            "title": $.*.description,
            "route": 'docs/' & $keys()[0],
            "location": 'docs/' & $.*.location,
            "icon": $.*.icon ? $.*.icon : ''
        },
        {
            "title": 'Техрадар',
            "route": 'techradar',
            "icon": 'track_changes'
        },
        technologies.sections.$spread().{
            "title": $.*.title,
            "route": 'techradar/' & $keys()[0],
            "location": 'techradar/' & $.*.title
        },
        {
            "title": 'Проблемы',
            "route": 'problems',
            "icon": 'report_problem'
        }
    ]
).{
    "title": title,
    "route": '/' & route,
    "icon": icon,
    "location": location ? location : route
}
`;

const CONTEXTS_QUERY_FOR_COMPONENT = `
(
    $MANIFEST := $;
    $distinct($lookup(components, '{%COMPONENT%}').*.contexts).(
        $CONTEXT := $lookup($MANIFEST.contexts, $);
        {
            "id": $,
            "title": $CONTEXT.title ? $CONTEXT.title : $
        }
    )
)
`;

const SUMMARY_COMPONENT_QUERY = `
(
    $COMPONENT_ID := '{%COMPONENT%}';
    $MANIFEST := $;
    $lookup(components, $COMPONENT_ID).(
        $COMPONENT := $;
        $ENTYTY := entity;
        $FORM := $MANIFEST.forms[$ENTYTY in entity].fields;
        $FIELDS := $append([
            {
                "title": "Идентификатор",
                "content": $COMPONENT_ID,
                "field": "id",
                "required": true
            },
            {
                "title": "Название",
                "content": title,
                "field": "title",
                "required": true
            }
        ], $FORM.$spread().{
            "title": $.*.title,
            "required": $.*.required,
            "content": $lookup($COMPONENT, $keys()[0]),
            "field": $keys()[0]
        });
    )
)
`;

const COMPONENT_LOCATIONS_QUERY = `
(
    $COMPONENT_ID := '{%COMPONENT%}';
    [$distinct($[$substring(path, 0, $length($COMPONENT_ID) + 12) = '/components/' & $COMPONENT_ID].location)]
)
`;

const SUMMARY_ASPECT_QUERY = `
(
    $ASPECT_ID := '{%ASPECT%}';
    $MANIFEST := $;
    $lookup(aspects, $ASPECT_ID).(
        $ASPECT := $;
        $FORM := $MANIFEST.forms["aspect" in entity].fields;
        $FIELDS := $append([
            {
                "title": "Идентификатор",
                "content": $ASPECT_ID,
                "field": "id",
                "required": true
            },
            {
                "title": "Название",
                "content": title,
                "field": "title",
                "required": true
            }
        ], $FORM.$spread().{
            "title": $.*.title,
            "required": $.*.required,
            "content": $lookup($ASPECT, $keys()[0]),
            "field": $keys()[0]
        });
    )
)
`;

const ASPECT_LOCATIONS_QUERY = `
(
    $ASPECT_ID := '{%ASPECT%}';
    [$distinct($[$substring(path, 0, $length($ASPECT_ID) + 9) = '/aspects/' & $ASPECT_ID].location)]
)
`;

const CONTEXTS_QUERY_FOR_ASPECT = `
(
    $MANIFEST := $;
    components.$spread().(
        $COMPONENT_ID := $keys()[0];
        $COMPONENT := $lookup($MANIFEST.components, $COMPONENT_ID);
        $COMPONENT['{%ASPECT%}' in aspects] ? 
        (
            $COMPONENT.*.contexts.(
                $CONTEXT := $lookup($MANIFEST.contexts, $);
                {
                "id": $,
                "title": $CONTEXT.title ? $CONTEXT.title : $
            })
        ) : undefined
    )
)
`;

const TECHNOLOGIES_QUERY = `
(
    $MANIFEST := $;
    $distinct(components.*.technologies).(
        $TECHKEY := $;
        $TECHNOLOGY := $lookup($MANIFEST.technologies.items, $);
        $TECHNOLOGY := $TECHNOLOGY ? $TECHNOLOGY : 
            $MANIFEST.technologies.items.*.$[$TECHKEY in aliases];
        $TECHNOLOGY := $TECHNOLOGY ? $TECHNOLOGY : {
            "section": "UNKNOWN",
            "title": "Не определено"
        }; 
        $SECTION := $lookup($MANIFEST.technologies.sections, $TECHNOLOGY.section);
        {
            "label": $,
            "key": $,
            "hint": $TECHNOLOGY.title,
            "link": $TECHNOLOGY.link,
            "section" : {
                "key": $TECHNOLOGY.section,
                "title": $SECTION.title ? $SECTION.title : "Не определено"
            }
        }
    )
)
`;

const TECHNOLOGY_QUERY = `
(
    $MANIFEST := $;
    $TECH_ID := '{%TECH_ID%}';
    $TECHNOLOGY := $lookup(technologies.items, $TECH_ID);
    $TECHNOLOGY := $TECHNOLOGY ? $TECHNOLOGY : technologies.items.*[$TECH_ID in aliases];
    $COMPONENTS := [$distinct([
            $MANIFEST.components.*[$TECH_ID in technologies].%, 
            $TECHNOLOGY.aliases.(
                $ALIAS := $;
                $MANIFEST.components.*[$ALIAS in technologies].%;
            )
        ]).$spread().{
            "id": $keys()[0],
            "title": *.title,
            "entity": *.entity ? *.entity : "component",
            "contexts": [*.presentations.contexts.$spread().(
                $CONTEXT := $lookup($MANIFEST.contexts, $);
                {
                    "id": $,
                    "title": $CONTEXT.title ? $CONTEXT.title : $
                }
            )],
            "technologies": [*.technologies]
        }[$TECH_ID in technologies]];
    $CONTEXTS := $distinct($COMPONENTS.contexts);
    {
        'title': $TECHNOLOGY.title,
        'link': $TECHNOLOGY.link,
        'aliases': $TECHNOLOGY.aliases,
        'components': $COMPONENTS,
        'contexts': $CONTEXTS
    }
)
`;

const PROBLEMS_QUERY = `
(
    $MANIFEST := $;
    $LOST_COMPONENTS := [
        components.$spread().{
            "problem": 'Компонент вне контекста',
            "id": $keys()[0],
            "title": *.title,
            "route": '/architect/components/' & $keys()[0],
            "presentations": $.*.presentations.contexts
        }.presentations.(
            $exists($lookup($MANIFEST.contexts, $)) ? undefined : %
        )
    ];
    $EMPTY_CONTEXTS := [
        contexts.$spread().(
            $KEY := $keys()[0];
            $COMPONENTS := $MANIFEST.components.*.presentations[$KEY in contexts];
            $exists($COMPONENTS) ? undefined : {
                "problem": "Пустые контексты",
                "id": $KEY,
                "title": *.title,
                "route": '/architect/contexts/' & $KEY
            }
        )
    ];
    $UNDEFINED_CONTEXTS := [
        components.$spread().(
            $KEY := $keys()[0];
            $COMPONENT := $;
            $CONTEXTS := *.presentations.contexts[$not($exists($lookup($MANIFEST.contexts, $)))];
            $CONTEXTS.{
                "problem": "Неизвестные контексты",
                "title": $ & " в компоненте " & $COMPONENT.*.title & " [" & $KEY & "]",
                "route": '/architect/components/' & $KEY
            }
        )
    ];
    $UNDEFINED_NAMESPACES := 
    [
        aspects.$spread().{
            "id": $keys()[0],
            "route": "/architect/aspects/" & $keys()[0],
            "title": *.location,
            "namespace": $split($keys()[0], "@")[0],
            "entity": "аспекте"
        },
        contexts.$spread().{
            "id": $keys()[0],
            "route": "/architect/contexts/" & $keys()[0],
            "title": *.location,
            "namespace": $split($keys()[0], "@")[0],
            "entity": "контексте"
        },
        components.$spread().{
            "id": $keys()[0],
            "route": "architect/components/" & $keys()[0],
            "title": title,
            "namespace": $split($keys()[0], "@")[0],
            "entity": "компоненте"
        }
    ].(
        $exists($lookup($MANIFEST.namespaces, namespace)) ? undefined :
        {
            "problem": 'Область имен отсутствует',
            "route": route,
            "title": namespace & " в " & entity & " " & title & " [" & id & "]"
        }
    );
    $UNDEFINED_COMPONENT := 
        [
            components.$spread().(
                $COMPONENT_ID := $keys()[0];
                $COMPONENT := $lookup($MANIFEST.components, $COMPONENT_ID);
                $COMPONENT.presentations.requires[$not($exists($lookup($MANIFEST.components, id)))].(
                    id ?
                    {
                        "problem": 'Компоненты не описаны',
                        'route': '/architect/components/' & $COMPONENT_ID,
                        "title": "Зависимость [" & id & "] не описана для компонента " & $COMPONENT_ID
                    } : undefined
                )
            )
        ];
    $UNDEFINED_ASPECT := 
        [
            components.$spread().(
                $COMPONENT_ID := $keys()[0];
                $COMPONENT := $lookup($MANIFEST.components, $COMPONENT_ID);
                $COMPONENT.aspects.(
                    $lookup($MANIFEST.aspects, $) ? undefined :                     {
                        "problem": 'Аспекты не определены',
                        'route': '/architect/aspects/' & $,
                        "title": "Аспект не описан [" & $ & "]"
                    }
                )
            )
        ];
    [
        $distinct($UNDEFINED_CONTEXTS),
        $distinct($LOST_COMPONENTS),
        $distinct($EMPTY_CONTEXTS),
        $distinct($UNDEFINED_NAMESPACES),
        $distinct($UNDEFINED_COMPONENT),
        $distinct($UNDEFINED_ASPECT)
    ]
)
`;

export default {
    // Меню
    menu () {
        return MENU_QUERY;
    },
    // Запрос по контексту
    context(context) {
        return SCHEMA_QUERY
            .replaceAll("{%CONTEXT_ID%}", context)
            .replaceAll("{%CONDITIONS%}", `$CONTEXT_ID in contexts`)
    },
    // Запрос по компоненту
    component(component) {
        return SCHEMA_QUERY
            .replaceAll("{%CONTEXT_ID%}", 'self')
            .replaceAll("{%CONDITIONS%}", `id = '${component}'`)
    },
    // Запрос контекстов в которых встречается компонент
    contextsForComponent(component) {
        return CONTEXTS_QUERY_FOR_COMPONENT.replaceAll("{%COMPONENT%}", component)
    },
    // Сводка по компоненту
    summaryForComponent(component) {
        return SUMMARY_COMPONENT_QUERY.replaceAll("{%COMPONENT%}", component)
    },
    // Определение размещения манифестов описывающих компонент
    locationsForComponent(component) {
        return COMPONENT_LOCATIONS_QUERY.replaceAll("{%COMPONENT%}", component)
    },
    // Запрос по аспекту
    aspect(aspect, context) {
        return SCHEMA_QUERY
            .replaceAll("{%CONTEXT_ID%}", context || 'self')
            .replaceAll("{%CONDITIONS%}", `'${aspect}' in aspects.id`)
    },
    // Сводка по аспекту
    summaryForAspect(aspect) {
        return SUMMARY_ASPECT_QUERY.replaceAll("{%ASPECT%}", aspect)
    },
    // Определение размещения манифестов описывающих аспект
    locationsForAspect(aspect) {
        return ASPECT_LOCATIONS_QUERY.replaceAll("{%ASPECT%}", aspect)
    },
    // Запрос контекстов в которых встречается компонент
    contextsForAspects(aspect) {
        return CONTEXTS_QUERY_FOR_ASPECT.replaceAll("{%ASPECT%}", aspect)
    },
    // Сбор информации об использованных технологиях
    collectTechnologies() {
        return TECHNOLOGIES_QUERY;
    },
    // Карточка технологии
    summaryForTechnology(technology) {
        return TECHNOLOGY_QUERY.replaceAll("{%TECH_ID%}", technology);
    },
    // Выявление проблем
    problems() {
        return PROBLEMS_QUERY;
    }
}
