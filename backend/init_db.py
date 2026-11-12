from main import Base, engine
# Explicit initial schema creation. Future schema changes require reviewed migrations.
Base.metadata.create_all(engine)
print('DEEP COMMAND initial schema ready')
