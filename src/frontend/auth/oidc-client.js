/*
Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

In any derivative products, you must retain the information of
owner of the original code and provide clear attribution to the project

        https://dochub.info

The use of this product or its derivatives for any purpose cannot be a secret.

  Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Maintainers:
    Vladislav Markin <markinvy@yandex.ru>

Contributors:
    Vladislav Markin <markinvy@yandex.ru>
*/


export default {
    login() {
        try {
            // Сохраняем текущий URL для возврата после авторизации
            const currentPath = window.location.pathname + window.location.search + window.location.hash;
            localStorage.setItem('last-visited-url', currentPath);
            
            // Перенаправляем на страницу авторизации GitLab
            window.OidcUserManager.signinRedirect()
                .then(() => {
                    // eslint-disable-next-line no-console
                    console.log('Redirecting to login page...');
                })
                .catch(error => {
                    // eslint-disable-next-line no-console
                    console.error('Error during login redirect:', error);
                });
        } catch (error) {
            console.error('Error during login:', error);
        }
    },
    logout() {
        try {
            // Очищаем токены
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('original-route');
            localStorage.removeItem('last-visited-url');
            
            // Выходим из системы
            window.OidcUserManager.signoutRedirect()
                .then(() => {
                    // eslint-disable-next-line no-console
                    console.log('User logged out');
                })
                .catch(error => {
                    // eslint-disable-next-line no-console
                    console.error('Error during logout:', error);
                    // В случае ошибки перенаправляем на главную страницу
                    window.location = window.origin + '/main';
                });
        } catch (error) {
            console.error('Error during logout:', error);
            // В случае ошибки перенаправляем на главную страницу
            window.location = window.origin + '/main';
        }
    },
    async signinCallback() {
        try {
            // Обрабатываем callback от OIDC провайдера
            if (window.location.hash) {
                await window.OidcUserManager.signinCallback();
                window.location.hash = '';
            }
            
            // Проверяем, авторизован ли пользователь
            const user = await window.OidcUserManager.getUser();
            if (!user) {
                console.error('User not authenticated after signin callback');
                return;
            }
            
            // Проверяем, есть ли сохраненный маршрут
            const originalRoute = window.localStorage.getItem('original-route');
            if (originalRoute) {
                try {
                    const parsedRoute = JSON.parse(originalRoute);
                    
                    // Удаляем сохраненный маршрут ТОЛЬКО после успешной авторизации
                    window.localStorage.removeItem('original-route');
                    
                    // Формируем полный URL с учетом параметров и хэша
                    let url = parsedRoute.path;
                    const queryParams = new URLSearchParams();
                    
                    // Добавляем параметры запроса
                    if (parsedRoute.query) {
                        Object.entries(parsedRoute.query).forEach(([key, value]) => {
                            queryParams.append(key, value);
                        });
                    }
                    
                    // Добавляем параметры запроса к URL, если они есть
                    const queryString = queryParams.toString();
                    if (queryString) {
                        url += '?' + queryString;
                    }
                    
                    // Добавляем хэш, если он есть
                    if (parsedRoute.hash) {
                        url += parsedRoute.hash;
                    }
                    
                    // Перенаправляем на восстановленный URL
                    window.location = window.origin + url;
                } catch (error) {
                    console.error('Error processing saved route:', error);
                    window.localStorage.removeItem('original-route');
                    window.location = window.origin + '/main';
                }
            } else {
                // Проверяем, есть ли сохраненный URL в localStorage
                const lastVisitedUrl = window.localStorage.getItem('last-visited-url');
                if (lastVisitedUrl) {
                    window.localStorage.removeItem('last-visited-url');
                    window.location = window.origin + lastVisitedUrl;
                } else {
                    window.location = window.origin + '/main';
                }
            }
        } catch (error) {
            console.error('Error during signin callback:', error);
            // НЕ удаляем маршрут при ошибке, чтобы можно было повторить попытку
            window.location = window.origin + '/main';
        }
    },
    async getAccessToken() {
      return (await window.OidcUserManager.getUser())?.access_token;
    }
};
