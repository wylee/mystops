FROM postgres:10.3

RUN echo \
    "deb http://apt.postgresql.org/pub/repos/apt/ stretch-pgdg main $PG_MAJOR" \
    > /etc/apt/sources.list.d/pgdg.list
RUN apt-get update
RUN apt-get install -y postgis
RUN rm -rf /var/lib/apt/lists/*
RUN apt-get purge -y --auto-remove
RUN rm -rf "$tempDir" /etc/apt/sources.list.d/temp.list
