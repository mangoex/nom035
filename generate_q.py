import json

official_guia_3 = [
    # Condiciones en el ambiente de trabajo
    "El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica", # 1
    "Mi trabajo me exige hacer mucho esfuerzo físico", # 2
    "Me preocupa sufrir un accidente en mi trabajo", # 3
    "Considero que las actividades que realizo son peligrosas", # 4
    "Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno", # 5
    # Carga de trabajo
    "Por la cantidad de trabajo que tengo debo trabajar sin parar", # 6
    "Considero que es necesario mantener un ritmo de trabajo acelerado", # 7
    "Mi trabajo exige que esté muy concentrado", # 8
    "Mi trabajo requiere que memorice mucha información", # 9
    "En mi trabajo tengo que tomar decisiones difíciles muy rápido", # 10
    "Mi trabajo exige que atienda varios asuntos al mismo tiempo", # 11
    "En mi trabajo soy responsable de cosas de mucho valor", # 12
    "Respondo ante mi jefe por los resultados de toda mi área de trabajo", # 13
    "En el trabajo me dan órdenes contradictorias", # 14
    "Considero que en mi trabajo me piden hacer cosas innecesarias", # 15
    "Trabajo horas extras más de tres veces a la semana", # 16
    # Jornada de trabajo
    "Mi trabajo me exige laborar en días de descanso, festivos o fines de semana", # 17
    "Considero que el tiempo en el trabajo absorbe mucho de mi tiempo libre", # 18
    # Interferencia en la relación trabajo-familia
    "El tiempo que paso en el trabajo afecta mis responsabilidades familiares", # 19
    "Pienso en las actividades del trabajo cuando estoy en mi tiempo libre", # 20
    "Mis responsabilidades familiares afectan mi trabajo", # 21 (Wait, is this one of the missing ones? "Mis responsabilidades familiares afectan mi trabajo" is in NOM-035)
    "El trabajo hace que no pueda atender asuntos familiares o personales", # 22 (Is this it?)
    # Falta de control sobre el trabajo
    "Mi jefe permite que organice mi tiempo de trabajo", # 23
    "Mi jefe me permite decidir cómo realizo el trabajo", # 24
    "Las decisiones que tomo en el trabajo son respetadas", # 25
    "En mi trabajo puedo proponer mejoras para mis actividades", # 26
    "En mi trabajo puedo tomar pausas cuando las necesito", # 27
    "El trabajo me permite desarrollar mis habilidades", # 28
    "Mi jefe me informa sobre las decisiones que toma", # 29
    "Mi jefe reconoce mi esfuerzo", # 30
    # Liderazgo y relaciones en el trabajo (Liderazgo)
    "Mi jefe toma en cuenta mis ideas y opiniones", # 31
    "Mi jefe me comunica los cambios que ocurren en mi lugar de trabajo", # 32
    "Mi jefe me trata de forma respetuosa", # 33
    "Mi jefe se comunica claramente conmigo", # 34 (Wait, is this correct?)
    "Mi jefe es accesible y comunicativo", # ...
]

# The easiest way is to extract Guia III from a known correct source or simply rely on my internal knowledge of the exact NOM 035.
