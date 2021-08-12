// Список пакетов в репе https://docs.gitlab.com/ee/api/packages.html
// Статистика по проекту https://docs.gitlab.com/ee/api/project_statistics.html
// components.*['sberuslugi@spt_auth_c2c' in aspects].presentations['global' in contexts].%
// components.$spread().{
//     "component": *,
//     "id": $keys()[0]
// }.component['sberuslugi@spt_chat' in aspects].%
// *[$type($)='string'].%
/*
(
    $MANIFEST := $;
    $CONTEXT_ID := 'sberuslugi/c2c';
    $CONTEXT := $lookup($MANIFEST.contexts, $CONTEXT_ID);
    {
        "title": $CONTEXT.title ? $CONTEXT.title : $CONTEXT_ID,
        "components": components.$spread().{
            "id": $keys()[0],
            "title": $.*.title,
            "entity": $.*.entity,
            "contexts": $distinct($.*.presentations.contexts),
            "requires": [$distinct($.*.presentations.requires).(
                $COMPONENT := $lookup($MANIFEST.components, $.id);
                {
                "id": $.id,
                "title": $COMPONENT.title ? $COMPONENT.title : $.title,
                "entity": $COMPONENT.entity ? $COMPONENT.entity : "component"
            })],
            "aspects": $.*.aspects.$spread().(
                $ASPECT := $lookup($MANIFEST.aspects, $);
                {
                "id": $,
                "title": $ASPECT.title ? $ASPECT.title : $
            })
        }[$CONTEXT_ID in contexts]
    }
)*/
