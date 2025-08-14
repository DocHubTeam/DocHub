/**************************************************************************************
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/
                            Author: Roman Piontik 
                            E-mail: R.Piontik@mail.ru
                            Project: https://dochub.info
**************************************************************************************/

import React from 'react';

export const Onepage = (props) => {
  return (
    <div>
      <h1>{props.title}</h1>
      <p>{props.content}</p>
    </div>
  );
};

